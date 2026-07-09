from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship('Application', backref='user', lazy=True)


class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company_name = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(150))
    job_description = db.Column(db.Text)
    status = db.Column(db.String(50), default='Applied')
    notes = db.Column(db.Text)
    fit_score = db.Column(db.Integer, nullable=True)
    fit_summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'company_name': self.company_name,
            'role': self.role,
            'job_description': self.job_description,
            'status': self.status,
            'notes': self.notes,
            'fit_score': self.fit_score,
            'fit_summary': self.fit_summary,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
