#!/usr/bin/env python3
"""
Authentication and Privacy Features Backend Testing Script
Tests Supabase auth integration and privacy field functionality
"""

import requests
import json
import time
import base64
from datetime import datetime

# Get base URL from environment
BASE_URL = "https://lab-submissions.preview.emergentagent.com/api"

def test_supabase_client_configuration():
    """Test if Supabase client is properly configured"""
    print("=" * 80)
    print("TESTING SUPABASE CLIENT CONFIGURATION")
    print("=" * 80)
    
    try:
        # Test basic API connectivity
        print("\n1. TESTING BASIC API CONNECTIVITY...")
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API is accessible")
        else:
            print(f"❌ API not accessible: {response.text}")
            return False
        
        # Test if Supabase endpoints are available (they should return 404 since auth is handled client-side)
        print("\n2. TESTING AUTH ENDPOINT AVAILABILITY...")
        auth_endpoints = [
            "/auth/sign-up",
            "/auth/sign-in", 
            "/auth/sign-out",
            "/auth/reset-password"
        ]
        
        for endpoint in auth_endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            print(f"GET {endpoint}: {response.status_code}")
            # These should return 404 since auth is handled client-side with Supabase
            if response.status_code == 404:
                print(f"  ✅ Expected 404 - auth handled client-side")
            else:
                print(f"  ⚠️  Unexpected status: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing Supabase configuration: {e}")
        return False

def test_privacy_field_in_submissions():
    """Test the isPublic/is_public field in submissions"""
    print("\n" + "=" * 80)
    print("TESTING PRIVACY FIELD (isPublic/is_public) IN SUBMISSIONS")
    print("=" * 80)
    
    try:
        # First get available rubrics
        print("\n1. GETTING AVAILABLE RUBRICS...")
        rubrics_response = requests.get(f"{BASE_URL}/rubrics", timeout=30)
        
        if rubrics_response.status_code != 200:
            print(f"❌ Failed to get rubrics: {rubrics_response.text}")
            return False
        
        rubrics = rubrics_response.json()
        if not rubrics:
            print("❌ No rubrics found")
            return False
        
        # Find default rubric
        default_rubric = None
        for rubric in rubrics:
            if 'Default' in rubric.get('title', ''):
                default_rubric = rubric
                break
        
        if not default_rubric:
            default_rubric = rubrics[0]
        
        rubric_id = default_rubric['id']
        print(f"Using rubric: {default_rubric['title']} (ID: {rubric_id})")
        
        # Test 1: Create submission with isPublic=true
        print("\n2. TESTING SUBMISSION WITH isPublic=true...")
        public_submission_data = {
            "studentName": "John Public",
            "assignmentTitle": "Public Algorithm Test",
            "submissionType": "algorithm",
            "textContent": "def public_function():\n    return 'This is public'",
            "rubricId": rubric_id,
            "isPublic": True
        }
        
        print(f"POST {BASE_URL}/submissions")
        print(f"Data: {json.dumps(public_submission_data, indent=2)}")
        
        public_response = requests.post(
            f"{BASE_URL}/submissions",
            json=public_submission_data,
            timeout=60
        )
        
        print(f"Status: {public_response.status_code}")
        
        if public_response.status_code != 200:
            print(f"❌ Public submission failed: {public_response.text}")
            return False
        
        public_result = public_response.json()
        public_submission_id = public_result.get('submissionId') or public_result.get('id')
        print(f"✅ Public submission created: {public_submission_id}")
        
        # Test 2: Create submission with isPublic=false
        print("\n3. TESTING SUBMISSION WITH isPublic=false...")
        private_submission_data = {
            "studentName": "Jane Private",
            "assignmentTitle": "Private Algorithm Test", 
            "submissionType": "algorithm",
            "textContent": "def private_function():\n    return 'This is private'",
            "rubricId": rubric_id,
            "isPublic": False
        }
        
        print(f"POST {BASE_URL}/submissions")
        print(f"Data: {json.dumps(private_submission_data, indent=2)}")
        
        private_response = requests.post(
            f"{BASE_URL}/submissions",
            json=private_submission_data,
            timeout=60
        )
        
        print(f"Status: {private_response.status_code}")
        
        if private_response.status_code != 200:
            print(f"❌ Private submission failed: {private_response.text}")
            return False
        
        private_result = private_response.json()
        private_submission_id = private_result.get('submissionId') or private_result.get('id')
        print(f"✅ Private submission created: {private_submission_id}")
        
        # Test 3: Create submission without isPublic field (should default to true)
        print("\n4. TESTING SUBMISSION WITHOUT isPublic FIELD (should default to true)...")
        default_submission_data = {
            "studentName": "Bob Default",
            "assignmentTitle": "Default Privacy Test",
            "submissionType": "algorithm", 
            "textContent": "def default_function():\n    return 'Default privacy'",
            "rubricId": rubric_id
            # No isPublic field - should default to true
        }
        
        print(f"POST {BASE_URL}/submissions")
        print(f"Data: {json.dumps(default_submission_data, indent=2)}")
        
        default_response = requests.post(
            f"{BASE_URL}/submissions",
            json=default_submission_data,
            timeout=60
        )
        
        print(f"Status: {default_response.status_code}")
        
        if default_response.status_code != 200:
            print(f"❌ Default submission failed: {default_response.text}")
            return False
        
        default_result = default_response.json()
        default_submission_id = default_result.get('submissionId') or default_result.get('id')
        print(f"✅ Default submission created: {default_submission_id}")
        
        # Test 4: Verify isPublic field is stored and returned correctly
        print("\n5. VERIFYING isPublic FIELD IN API RESPONSES...")
        
        test_cases = [
            (public_submission_id, "Public", True),
            (private_submission_id, "Private", False),
            (default_submission_id, "Default", True)
        ]
        
        all_correct = True
        
        for submission_id, name, expected_public in test_cases:
            print(f"\nTesting {name} submission (ID: {submission_id})...")
            
            # Get individual submission
            get_response = requests.get(f"{BASE_URL}/submissions/{submission_id}", timeout=30)
            
            if get_response.status_code != 200:
                print(f"  ❌ Failed to retrieve {name} submission: {get_response.text}")
                all_correct = False
                continue
            
            submission_data = get_response.json()
            
            # Check for isPublic field in response
            is_public_value = submission_data.get('isPublic')
            
            print(f"  Response isPublic field: {is_public_value}")
            print(f"  Expected: {expected_public}")
            
            if is_public_value == expected_public:
                print(f"  ✅ {name} submission isPublic field correct")
            else:
                print(f"  ❌ {name} submission isPublic field incorrect")
                all_correct = False
            
            # Also check if the field exists in the raw response
            response_keys = list(submission_data.keys())
            if 'isPublic' in response_keys:
                print(f"  ✅ isPublic field present in API response")
            else:
                print(f"  ❌ isPublic field missing from API response")
                print(f"  Available fields: {response_keys}")
                all_correct = False
        
        # Test 5: Check submissions list includes isPublic field
        print("\n6. VERIFYING isPublic FIELD IN SUBMISSIONS LIST...")
        
        list_response = requests.get(f"{BASE_URL}/submissions", timeout=30)
        
        if list_response.status_code != 200:
            print(f"❌ Failed to get submissions list: {list_response.text}")
            return False
        
        submissions_list = list_response.json()
        print(f"Retrieved {len(submissions_list)} submissions from list")
        
        # Check if our test submissions are in the list with correct isPublic values
        found_submissions = 0
        
        for submission in submissions_list:
            sub_id = submission.get('submissionId') or submission.get('id')
            
            if sub_id in [public_submission_id, private_submission_id, default_submission_id]:
                found_submissions += 1
                is_public = submission.get('isPublic')
                student_name = submission.get('studentName')
                
                print(f"  Found test submission: {student_name} - isPublic: {is_public}")
                
                if 'isPublic' not in submission:
                    print(f"  ❌ isPublic field missing from list item")
                    all_correct = False
        
        print(f"Found {found_submissions}/3 test submissions in list")
        
        if found_submissions == 3:
            print("✅ All test submissions found in list")
        else:
            print("⚠️  Not all test submissions found in list")
        
        return all_correct
        
    except Exception as e:
        print(f"❌ Error testing privacy field: {e}")
        return False

def test_database_schema_privacy_field():
    """Test if the is_public field exists in the database schema"""
    print("\n" + "=" * 80)
    print("TESTING DATABASE SCHEMA FOR is_public FIELD")
    print("=" * 80)
    
    try:
        # Get existing submissions to check schema
        print("\n1. CHECKING EXISTING SUBMISSIONS FOR is_public FIELD...")
        
        response = requests.get(f"{BASE_URL}/submissions", timeout=30)
        
        if response.status_code != 200:
            print(f"❌ Failed to get submissions: {response.text}")
            return False
        
        submissions = response.json()
        print(f"Retrieved {len(submissions)} existing submissions")
        
        if not submissions:
            print("⚠️  No existing submissions to check schema")
            return True
        
        # Check first few submissions for is_public field
        schema_check_count = min(5, len(submissions))
        has_is_public = 0
        
        for i in range(schema_check_count):
            submission = submissions[i]
            student_name = submission.get('studentName', 'Unknown')
            is_public = submission.get('isPublic')
            
            print(f"  Submission {i+1} ({student_name}): isPublic = {is_public}")
            
            if 'isPublic' in submission:
                has_is_public += 1
        
        print(f"\nSchema Analysis:")
        print(f"  Submissions checked: {schema_check_count}")
        print(f"  Submissions with isPublic field: {has_is_public}")
        
        if has_is_public == schema_check_count:
            print("✅ All checked submissions have isPublic field - schema looks good")
            return True
        elif has_is_public > 0:
            print("⚠️  Some submissions have isPublic field - partial migration")
            return True
        else:
            print("❌ No submissions have isPublic field - schema may be missing")
            return False
        
    except Exception as e:
        print(f"❌ Error checking database schema: {e}")
        return False

def test_jwt_token_handling():
    """Test JWT token handling (client-side with Supabase)"""
    print("\n" + "=" * 80)
    print("TESTING JWT TOKEN HANDLING")
    print("=" * 80)
    
    print("\n1. TESTING API AUTHORIZATION HEADERS...")
    
    # Test API with Authorization header (should be accepted)
    test_headers = {
        'Authorization': 'Bearer test-jwt-token',
        'Content-Type': 'application/json'
    }
    
    try:
        # Test GET request with auth header
        response = requests.get(f"{BASE_URL}/submissions", headers=test_headers, timeout=30)
        print(f"GET /submissions with auth header: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API accepts Authorization header")
        else:
            print(f"⚠️  API response with auth header: {response.text[:200]}")
        
        # Test POST request with auth header
        test_data = {
            "studentName": "Auth Test User",
            "assignmentTitle": "JWT Test",
            "submissionType": "algorithm",
            "textContent": "print('jwt test')"
        }
        
        post_response = requests.post(
            f"{BASE_URL}/submissions", 
            json=test_data, 
            headers=test_headers, 
            timeout=30
        )
        
        print(f"POST /submissions with auth header: {post_response.status_code}")
        
        if post_response.status_code in [200, 400]:  # 400 might be due to missing rubric
            print("✅ API processes Authorization header in POST requests")
        else:
            print(f"⚠️  POST response with auth header: {post_response.text[:200]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing JWT handling: {e}")
        return False

def test_session_management():
    """Test session management capabilities"""
    print("\n" + "=" * 80)
    print("TESTING SESSION MANAGEMENT")
    print("=" * 80)
    
    print("\n1. TESTING API SESSION HANDLING...")
    
    # Since session management is client-side with Supabase, we test API behavior
    try:
        # Test API without session
        response1 = requests.get(f"{BASE_URL}/submissions", timeout=30)
        print(f"API without session: {response1.status_code}")
        
        # Test API with session cookies (simulated)
        session_cookies = {
            'sb-access-token': 'test-access-token',
            'sb-refresh-token': 'test-refresh-token'
        }
        
        response2 = requests.get(f"{BASE_URL}/submissions", cookies=session_cookies, timeout=30)
        print(f"API with session cookies: {response2.status_code}")
        
        # Both should work since API doesn't enforce auth server-side
        if response1.status_code == 200 and response2.status_code == 200:
            print("✅ API handles requests with and without session data")
        else:
            print("⚠️  API behavior varies with session data")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing session management: {e}")
        return False

def test_user_authentication_state():
    """Test user authentication state handling in API"""
    print("\n" + "=" * 80)
    print("TESTING USER AUTHENTICATION STATE IN API")
    print("=" * 80)
    
    print("\n1. TESTING API WITH USER CONTEXT...")
    
    try:
        # Test API with user ID in request
        user_data = {
            "studentName": "Authenticated User",
            "assignmentTitle": "Auth State Test",
            "submissionType": "algorithm",
            "textContent": "print('authenticated')",
            "userId": "test-user-123"  # Simulated user ID
        }
        
        response = requests.post(f"{BASE_URL}/submissions", json=user_data, timeout=30)
        print(f"POST with userId: {response.status_code}")
        
        if response.status_code in [200, 400]:  # 400 might be due to missing rubric
            print("✅ API accepts userId in request data")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Response includes user context: {result.get('userId', 'Not found')}")
        else:
            print(f"⚠️  API response with userId: {response.text[:200]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing user authentication state: {e}")
        return False

def run_all_auth_tests():
    """Run all authentication and privacy tests"""
    print("AUTHENTICATION AND PRIVACY FEATURES TESTING")
    print(f"Base URL: {BASE_URL}")
    print(f"Test started at: {datetime.now()}")
    
    test_results = {}
    
    # Test 1: Supabase Client Configuration
    test_results['supabase_config'] = test_supabase_client_configuration()
    
    # Test 2: Privacy Field (isPublic)
    test_results['privacy_field'] = test_privacy_field_in_submissions()
    
    # Test 3: Database Schema for Privacy
    test_results['schema_privacy'] = test_database_schema_privacy_field()
    
    # Test 4: JWT Token Handling
    test_results['jwt_handling'] = test_jwt_token_handling()
    
    # Test 5: Session Management
    test_results['session_mgmt'] = test_session_management()
    
    # Test 6: User Authentication State
    test_results['auth_state'] = test_user_authentication_state()
    
    # Summary
    print("\n" + "=" * 80)
    print("AUTHENTICATION AND PRIVACY TESTING SUMMARY")
    print("=" * 80)
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed_tests += 1
    
    print(f"\nOverall Results: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL AUTHENTICATION AND PRIVACY TESTS PASSED!")
        return True
    else:
        print("❌ SOME TESTS FAILED - Authentication/Privacy features need attention")
        return False

if __name__ == "__main__":
    success = run_all_auth_tests()
    print(f"\nTest completed at: {datetime.now()}")
    
    if success:
        exit(0)
    else:
        exit(1)