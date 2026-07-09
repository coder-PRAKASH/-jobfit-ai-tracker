import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from dotenv import load_dotenv
from models import db, User, Application
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 'sqlite:///job_tracker.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-change-this')

db.init_app(app)

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
gemini_model = genai.GenerativeModel('gemini-2.5-flash')


# ---------- Auth helper ----------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        try:
            token = token.replace('Bearer ', '')
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                raise Exception('User not found')
        except Exception:
            return jsonify({'error': 'Token invalid or expired'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


# ---------- Auth routes ----------
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({'error': 'Missing fields'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Account created successfully'}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'token': token,
        'user': {'id': user.id, 'name': user.name, 'email': user.email}
    }), 200


# ---------- Application CRUD routes ----------
@app.route('/api/applications', methods=['GET'])
@token_required
def get_applications(current_user):
    apps = Application.query.filter_by(user_id=current_user.id).order_by(
        Application.created_at.desc()
    ).all()
    return jsonify([a.to_dict() for a in apps]), 200


@app.route('/api/applications', methods=['POST'])
@token_required
def create_application(current_user):
    data = request.get_json()
    application = Application(
        user_id=current_user.id,
        company_name=data.get('company_name'),
        role=data.get('role'),
        job_description=data.get('job_description', ''),
        status=data.get('status', 'Applied'),
        notes=data.get('notes', ''),
        fit_score=None,
        fit_summary=None
    )
    db.session.add(application)
    db.session.commit()
    return jsonify(application.to_dict()), 201


@app.route('/api/applications/<int:app_id>', methods=['PUT'])
@token_required
def update_application(current_user, app_id):
    application = Application.query.filter_by(id=app_id, user_id=current_user.id).first()
    if not application:
        return jsonify({'error': 'Not found'}), 404

    data = request.get_json()
    for field in ['company_name', 'role', 'job_description', 'status', 'notes']:
        if field in data:
            setattr(application, field, data[field])
    db.session.commit()
    return jsonify(application.to_dict()), 200


@app.route('/api/applications/<int:app_id>', methods=['DELETE'])
@token_required
def delete_application(current_user, app_id):
    application = Application.query.filter_by(id=app_id, user_id=current_user.id).first()
    if not application:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(application)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


# ---------- AI fit analysis route ----------
@app.route('/api/applications/<int:app_id>/analyze', methods=['POST'])
@token_required
def analyze_fit(current_user, app_id):
    application = Application.query.filter_by(id=app_id, user_id=current_user.id).first()
    if not application:
        return jsonify({'error': 'Not found'}), 404

    data = request.get_json()
    resume_text = data.get('resume_text', '')

    if not resume_text:
        return jsonify({'error': 'resume_text is required'}), 400

    prompt = f"""You are a technical recruiter assistant. Compare the candidate's resume
against the job description below. Respond ONLY with valid JSON, no other text, in this exact format:

{{
  "fit_score": <integer 0-100>,
  "matching_skills": [<list of skills from the resume that match the JD>],
  "missing_skills": [<list of skills the JD wants but resume lacks>],
  "summary": "<2-3 sentence honest assessment>",
  "project_to_highlight": "<which resume project best fits this role and why, 1 sentence>"
}}

JOB DESCRIPTION:
{application.job_description}

RESUME:
{resume_text}
"""

    try:
        response = gemini_model.generate_content(prompt)
        raw_text = response.text.strip()
        raw_text = raw_text.replace('```json', '').replace('```', '').strip()
        result = json.loads(raw_text)

        application.fit_score = result.get('fit_score')
        application.fit_summary = json.dumps(result)
        db.session.commit()

        return jsonify(result), 200

    except json.JSONDecodeError:
        return jsonify({'error': 'AI response could not be parsed, try again'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
