from database import get_connection
from service import organization_service
import psycopg2
import psycopg2.extras
import json
import logging
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta

def send_otp_email(email, otp):
    status =  False
    msg = MIMEText(f"Your organization OTP is: {otp}")
    msg["Subject"] = "Organization Signup OTP"
    msg["From"] = "mehardil13302@gmail.com"
    msg["To"] = email
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login("mehardil13302@gmail.com", "cpll zdxv ukib cwrt")
        server.send_message(msg)
        status = True
        return otp,status

        

def create_organization(data):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = """
        INSERT INTO organizations (name, description, contact_email, contact_phone, logo_url, is_active, settings)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """
    try:
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
        conn.commit()
        print(org_id, "here is organization id")
        input("wait")
        otp = random.randint(100000, 999999)
        expiry = datetime.utcnow() + timedelta(minutes=10)
        otp,status = send_otp_email(data['contact_email'], otp)
        cursor.execute(
            "INSERT INTO organization_otps (org_id, otp, expiry) VALUES (%s, %s, %s)",
            (org_id, otp, expiry))
        if status:
            result = verify_organization_otp(org_id,otp)
        conn.commit()
        if result:
            cursor.execute("SELECT * FROM organizations WHERE id = %s", (org_id,))
            result = cursor.fetchone()
            print("organization is register successfully")
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        cursor.close()
        conn.close()
        raise ValueError("Organization name already exists.")
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        raise e
    cursor.close()
    conn.close()
    return result


def verify_organization_otp(org_id, otp):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute(
        "SELECT * FROM organization_otps WHERE org_id = %s AND otp = %s AND expiry > %s",
        (org_id, otp, datetime.utcnow())
    )
    otp_record = cursor.fetchone()
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
    else:
        result = False
    cursor.close()
    conn.close()
    return result