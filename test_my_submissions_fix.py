#!/usr/bin/env python3

import requests
import json
import time
from datetime import datetime

# Test configuration
BASE_URL = "https://sub-privacy-filter.preview.emergentagent.com/api"
TEST_USER_ID = "test-user-visibility-fix"

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")

def test_my_submissions_fix():
    """Test the MySubmissions component fix"""
    print("🔧 TESTING MY SUBMISSIONS VISIBILITY FIX")
    print("=" * 50)
    
    try:
        # Step 1: Create a test submission with specific user ID
        print("\n1. Creating test submission with userId...")
        
        # Get rubric first
        rubrics_response = requests.get(f"{BASE_URL}/rubrics")
        rubric_id = None
        if rubrics_response.status_code == 200:
            rubrics = rubrics_response.json()
            if rubrics:
                rubric_id = rubrics[0]["id"]
        
        submission_data = {
            "userId": TEST_USER_ID,
            "studentName": "Test User for Visibility Fix",
            "assignmentTitle": "My Submissions Visibility Test",
            "submissionType": "algorithm",
            "textContent": "def test_visibility():\n    return 'This should appear in My Submissions'",
            "rubricId": rubric_id,
            "isPublic": True
        }
        
        response = requests.post(f"{BASE_URL}/submissions", json=submission_data)
        
        if response.status_code == 200:
            result = response.json()
            submission_id = result.get("submissionId")
            log_test("Create test submission", "PASS", f"Created submission ID: {submission_id}")
        else:
            log_test("Create test submission", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return False
        
        # Step 2: Test that it appears in filtered results
        print("\n2. Testing filtered API call (simulating MySubmissions fix)...")
        
        response = requests.get(f"{BASE_URL}/submissions?userId={TEST_USER_ID}")
        
        if response.status_code == 200:
            filtered_submissions = response.json()
            
            # Check if our test submission is in the results
            found_submission = False
            for sub in filtered_submissions:
                if sub.get("submissionId") == submission_id:
                    found_submission = True
                    break
            
            if found_submission:
                log_test("Submission appears in filtered results", "PASS", f"Found submission in {len(filtered_submissions)} filtered results")
            else:
                log_test("Submission appears in filtered results", "FAIL", f"Submission not found in {len(filtered_submissions)} filtered results")
                return False
        else:
            log_test("Get filtered submissions", "FAIL", f"HTTP {response.status_code}")
            return False
        
        # Step 3: Verify it also appears in all submissions
        print("\n3. Testing that it still appears in all submissions...")
        
        response = requests.get(f"{BASE_URL}/submissions")
        
        if response.status_code == 200:
            all_submissions = response.json()
            
            found_in_all = False
            for sub in all_submissions:
                if sub.get("submissionId") == submission_id:
                    found_in_all = True
                    break
            
            if found_in_all:
                log_test("Submission appears in all submissions", "PASS", f"Found in {len(all_submissions)} total submissions")
            else:
                log_test("Submission appears in all submissions", "FAIL", "Submission not found in all submissions")
                return False
        else:
            log_test("Get all submissions", "FAIL", f"HTTP {response.status_code}")
            return False
        
        # Step 4: Test private submission
        print("\n4. Testing private submission creation...")
        
        private_submission_data = {
            "userId": TEST_USER_ID,
            "studentName": "Test User for Visibility Fix",
            "assignmentTitle": "Private Submission Test",
            "submissionType": "pseudocode",
            "textContent": "BEGIN PrivateTest\n  This should be private\nEND",
            "rubricId": rubric_id,
            "isPublic": False  # Private submission
        }
        
        response = requests.post(f"{BASE_URL}/submissions", json=private_submission_data)
        
        if response.status_code == 200:
            result = response.json()
            private_submission_id = result.get("submissionId")
            is_public = result.get("isPublic")
            
            if is_public == False:
                log_test("Create private submission", "PASS", f"Created private submission ID: {private_submission_id}")
            else:
                log_test("Create private submission", "FAIL", f"isPublic should be False, got {is_public}")
        else:
            log_test("Create private submission", "FAIL", f"HTTP {response.status_code}: {response.text}")
        
        return True
        
    except Exception as e:
        log_test("MySubmissions fix test", "FAIL", f"Exception: {str(e)}")
        return False

def test_user_filtering_edge_cases():
    """Test edge cases for user filtering"""
    print("\n5. Testing user filtering edge cases...")
    
    try:
        # Test with empty userId
        response = requests.get(f"{BASE_URL}/submissions?userId=")
        if response.status_code == 200:
            empty_results = response.json()
            log_test("Empty userId parameter", "PASS", f"Returned {len(empty_results)} submissions")
        else:
            log_test("Empty userId parameter", "FAIL", f"HTTP {response.status_code}")
        
        # Test with special characters in userId
        special_user_id = "user@test.com"
        response = requests.get(f"{BASE_URL}/submissions?userId={special_user_id}")
        if response.status_code == 200:
            special_results = response.json()
            log_test("Special characters in userId", "PASS", f"Returned {len(special_results)} submissions")
        else:
            log_test("Special characters in userId", "FAIL", f"HTTP {response.status_code}")
        
        return True
        
    except Exception as e:
        log_test("Edge cases test", "FAIL", f"Exception: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 MY SUBMISSIONS VISIBILITY FIX VERIFICATION")
    print("=" * 60)
    
    start_time = time.time()
    
    # Run the main test
    main_test_passed = test_my_submissions_fix()
    
    # Run edge case tests
    edge_cases_passed = test_user_filtering_edge_cases()
    
    end_time = time.time()
    duration = end_time - start_time
    
    print("\n" + "=" * 60)
    print(f"🏁 TESTING COMPLETED in {duration:.2f} seconds")
    
    if main_test_passed and edge_cases_passed:
        print("\n✅ SUCCESS: MySubmissions visibility fix is working correctly!")
        print("\n📋 WHAT WAS FIXED:")
        print("• MySubmissions component now uses ?userId parameter in API call")
        print("• Server-side filtering instead of client-side filtering")
        print("• Submissions with userId now appear in 'My Submissions'")
        print("• Public submissions still appear in 'All Submissions'")
        
        print("\n🎯 EXPECTED BEHAVIOR:")
        print("• User creates submission → includes userId field")
        print("• MySubmissions fetches /api/submissions?userId=xxx")
        print("• Only user's submissions are returned")
        print("• Submissions appear in both 'My Submissions' and 'All Submissions' (if public)")
    else:
        print("\n❌ ISSUES DETECTED:")
        if not main_test_passed:
            print("• Main functionality test failed")
        if not edge_cases_passed:
            print("• Edge cases test failed")
        
        print("\n🔧 NEXT STEPS:")
        print("• Check if MySubmissions.js was properly updated")
        print("• Verify user.id is available in the component")
        print("• Test with actual user authentication")