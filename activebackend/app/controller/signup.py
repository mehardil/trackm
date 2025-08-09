import logging
from fastapi import APIRouter
from service import signup_service
router = APIRouter()

@router.post("/signup/")
async def signup(signupdata:dict):
    logging.info(f"Called signup with signupdata={signupdata}")
    try:
        result = signup_service.create_organization(signupdata)
        logging.info("signup succeeded")
        return result
    except Exception as e:
        logging.error(f"signup failed: {e}")
        raise

@router.post("/verify-otp")
async def verify_otp(otpdata: dict):
    logging.info(f"Called verify_otp with otpdata={otpdata}")
    try:
        org_id = otpdata.get('org_id')
        otp = otpdata.get('otp')
        if not org_id or not otp:
            return {"error": "org_id and otp are required"}
        print("otp here" ,org_id ,otp)
        result = signup_service.verify_organization_otp(org_id, otp)
        if result:
            logging.info(f"OTP verification succeeded for org_id={org_id}")
            return {"success": True, "message": "Organization verified successfully"}
        else:
            logging.warning(f"OTP verification failed for org_id={org_id}")
            return {"success": False, "message": "Invalid or expired OTP"}
    except Exception as e:
        logging.error(f"verify_otp failed: {e}")
        raise
