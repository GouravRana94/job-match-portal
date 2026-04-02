import requests
import json

BASE_URL = "http://localhost:8000"

def test_ml_service():
    print("🧪 Testing ML Service\n")
    
    # Test health
    print("1. Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"✅ Health check: {response.json()}")
    
    # Test model info
    print("\n2. Testing model info...")
    response = requests.get(f"{BASE_URL}/api/model-info")
    print(f"✅ Model info: {response.json()}")
    
    # Test match endpoint with sample data
    print("\n3. Testing match endpoint...")
    
    # First, get a job seeker ID from database
    import psycopg2
    conn = psycopg2.connect(
        host="localhost",
        database="jobmatch",
        user="jobmatch_user",
        password="jobmatch123"
    )
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM job_seekers LIMIT 1")
    seeker_id = cur.fetchone()
    
    cur.execute("SELECT id FROM jobs LIMIT 5")
    job_ids = [row[0] for row in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    if seeker_id and job_ids:
        match_data = {
            "job_seeker_id": seeker_id[0],
            "job_ids": job_ids
        }
        
        response = requests.post(f"{BASE_URL}/api/match", json=match_data)
        matches = response.json()
        
        print(f"✅ Generated {len(matches)} matches")
        if matches:
            print(f"   Top match score: {matches[0]['match_score']}%")
            print(f"   Top match details: {json.dumps(matches[0]['match_details'], indent=2)}")
    else:
        print("⚠️ No test data found in database")
    
    print("\n🎉 ML Service tests completed!")

if __name__ == "__main__":
    test_ml_service()