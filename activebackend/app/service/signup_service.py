from database import get_connection
import psycopg2
import psycopg2.extras
import json
import logging
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import threading

def send_otp_email(email, otp):
    msg = MIMEText(f"Your organization OTP is: {otp}")
    msg["Subject"] = "Organization Signup OTP"
    msg["From"] = "mehardil13302@gmail.com"
    msg["To"] = email
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login("mehardil13302@gmail.com", "cpll zdxv ukib cwrt")
            server.send_message(msg)
        return True
    except Exception as e:
        logging.error(f"Failed to send OTP email: {e}")
        return False

def send_otp_email_background(email, otp):
    thread = threading.Thread(target=send_otp_email, args=(email, otp))
    thread.daemon = True
    thread.start()

def create_organization(data):
    result = None
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                query = """
                    INSERT INTO organizations (name, description, contact_email, contact_phone, logo_url, is_active, settings)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """
                cursor.execute(query, (
                    data['name'],
                    data['description'],
                    data['contact_email'],
                    data['contact_phone'],
                    data['logo_url'],
                    False,
                    json.dumps(data['settings'])
                ))
                org_id = cursor.fetchone()['id']
                otp = random.randint(100000, 999999)
                expiry = datetime.utcnow() + timedelta(minutes=10)
                cursor.execute(
                    "INSERT INTO organization_otps (org_id, otp, expiry) VALUES (%s, %s, %s)",
                    (org_id, otp, expiry)
                )
                conn.commit()
                send_otp_email_background(data['contact_email'], otp)
                result = {"org_id": org_id, "message": "Organization created. OTP sent to email."}
    except psycopg2.errors.UniqueViolation:
        raise ValueError("Organization name already exists.")
    except Exception as e:
        logging.error(f"Error creating organization: {e}")
        raise
    return result

def verify_organization_otp(org_id, otp):
    result = False
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                
                cursor.execute(
                    "SELECT 1 FROM organization_otps WHERE org_id = %s AND otp = '%s'",
                    (org_id, otp)
                )
                otp_record = cursor.fetchone()
                print("this point is checker",otp_record)
                if otp_record:
                    cursor.execute(
                        "UPDATE organizations SET is_active = %s WHERE id = %s",
                        (True, org_id)
                    )
                    cursor.execute(
                        "DELETE FROM organization_otps WHERE org_id = %s",
                        (org_id,)
                    )
                    conn.commit()
                    result = True
    except Exception as e:
        logging.error(f"Error verifying OTP: {e}")
        raise
    return result