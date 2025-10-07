#!/usr/bin/env python3
"""
Backend Testing for Intelligent Rubrics-Based Evaluator
Testing bug fixes for:
1. Syntax Error Detection in AI evaluation
2. Loading State Bug - submission status transitions
"""

import requests
import json
import time
import sys
from typing import Dict, Any, List

# Configuration
BASE_URL = "https://submit-repair-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.test_results = []
        self.rubric_id = None
        self.submission_ids = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_rubrics_field_structure(self):
        """Test 1: Verify Rubric API returns correct field names (id, submission_type)"""
        print("\n=== TEST 1: Verifying Rubric API Field Structure ===")
        try:
            # First ensure we have a rubric
            create_response = requests.post(f"{self.base_url}/rubrics/default", 
                json={
                    "title": "Form Test Rubric",
                    "description": "Testing rubric for form submission fix",
                    "submissionType": "any",
                    "createdBy": "form_test"
                },
                headers=self.headers,
                timeout=30
            )
            
            # Get rubrics to verify field structure
            response = requests.get(f"{self.base_url}/rubrics", headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                rubrics = response.json()
                
                if not rubrics:
                    self.log_test("Rubrics API Response", False, "No rubrics found in database")
                    return False
                
                rubric = rubrics[0]
                self.rubric_id = rubric.get('id')
                
                # Check for required fields that frontend expects
                required_fields = ['id', 'submission_type']
                missing_fields = [field for field in required_fields if field not in rubric]
                
                if missing_fields:
                    self.log_test("Rubric Field Structure", False, 
                                f"Missing required fields: {missing_fields}",
                                f"Available fields: {list(rubric.keys())}")
                    return False
                
                # Verify field types
                if not isinstance(rubric['id'], str) or len(rubric['id']) < 30:
                    self.log_test("Rubric ID Format", False, 
                                f"ID should be UUID string, got: {rubric['id']}")
                    return False
                
                self.log_test("Rubric Field Structure", True, 
                            f"All required fields present: {required_fields}")
                self.log_test("Rubric ID Format", True, 
                            f"Valid UUID format: {rubric['id']}")
                
                return True
                
            else:
                self.log_test("Rubrics API Response", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Rubrics API Test", False, f"Exception: {str(e)}")
            return False
    
    def test_submission_with_valid_rubric_id(self):
        """Test 2: Test submission with valid rubric UUID (the fix)"""
        print("\n=== TEST 2: Testing Submission with Valid Rubric UUID ===")
        
        if not self.rubric_id:
            self.log_test("Submission Test Setup", False, "No rubric ID available for testing")
            return False
        
        test_cases = [
            {
                "name": "Algorithm Submission",
                "data": {
                    "studentName": "Alice Johnson",
                    "assignmentTitle": "Bubble Sort Algorithm",
                    "submissionType": "algorithm",
                    "textContent": """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

# Test the function
numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = bubble_sort(numbers)
print("Sorted array:", sorted_numbers)
                    """,
                    "rubricId": self.rubric_id
                }
            },
            {
                "name": "Pseudocode Submission", 
                "data": {
                    "studentName": "Bob Smith",
                    "assignmentTitle": "Binary Search Pseudocode",
                    "submissionType": "pseudocode",
                    "textContent": """
ALGORITHM BinarySearch
INPUT: sorted_array, target_value
OUTPUT: index of target_value or -1 if not found

BEGIN
    left = 0
    right = length(sorted_array) - 1
    
    WHILE left <= right DO
        mid = (left + right) / 2
        
        IF sorted_array[mid] = target_value THEN
            RETURN mid
        ELSE IF sorted_array[mid] < target_value THEN
            left = mid + 1
        ELSE
            right = mid - 1
        END IF
    END WHILE
    
    RETURN -1
END
                    """,
                    "rubricId": self.rubric_id
                }
            },
            {
                "name": "Flowchart Submission",
                "data": {
                    "studentName": "Carol Davis",
                    "assignmentTitle": "Simple Calculator Flowchart",
                    "submissionType": "flowchart",
                    "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                    "fileName": "calculator_flowchart.png",
                    "rubricId": self.rubric_id
                }
            }
        ]
        
        success_count = 0
        
        for test_case in test_cases:
            try:
                print(f"\nTesting {test_case['name']}...")
                
                response = requests.post(f"{self.base_url}/submissions", 
                    json=test_case['data'],
                    headers=self.headers,
                    timeout=60
                )
                
                if response.status_code in [200, 201]:
                    submission = response.json()
                    submission_id = submission.get('id')
                    
                    if submission_id:
                        self.submission_ids.append(submission_id)
                        
                        # Verify rubric_id is properly stored
                        stored_rubric_id = submission.get('rubric_id')
                        
                        if stored_rubric_id == self.rubric_id:
                            self.log_test(f"{test_case['name']} - UUID Storage", True, 
                                        f"Rubric UUID correctly stored: {stored_rubric_id}")
                            success_count += 1
                        else:
                            self.log_test(f"{test_case['name']} - UUID Storage", False, 
                                        f"Expected: {self.rubric_id}, Got: {stored_rubric_id}")
                        
                        self.log_test(f"{test_case['name']} - Creation", True, 
                                    f"Submission created with ID: {submission_id}")
                    else:
                        self.log_test(f"{test_case['name']} - Creation", False, 
                                    "No submission ID in response")
                        
                else:
                    error_text = response.text
                    self.log_test(f"{test_case['name']} - Creation", False, 
                                f"HTTP {response.status_code}: {error_text}")
                    
                    # Check for the specific UUID error we're testing for
                    if "invalid input syntax for type uuid" in error_text:
                        self.log_test("UUID Error Detection", False, 
                                    "❌ CRITICAL: The original UUID error is still occurring!")
                        print(f"ERROR DETAILS: {error_text}")
                        
            except Exception as e:
                self.log_test(f"{test_case['name']} - Creation", False, f"Exception: {str(e)}")
        
        return success_count == len(test_cases)
    
    def test_submission_retrieval(self):
        """Test 3: Verify submission retrieval and evaluation status"""
        print("\n=== TEST 3: Testing Submission Retrieval ===")
        
        if not self.submission_ids:
            self.log_test("Submission Retrieval Setup", False, "No submission IDs to test")
            return False
        
        success_count = 0
        
        for submission_id in self.submission_ids:
            try:
                # Wait a bit for potential AI evaluation
                time.sleep(2)
                
                response = requests.get(f"{self.base_url}/submissions/{submission_id}", 
                                      headers=self.headers, timeout=30)
                
                if response.status_code == 200:
                    submission = response.json()
                    
                    # Verify submission data
                    status = submission.get('status', 'unknown')
                    student_name = submission.get('studentName', 'N/A')
                    
                    self.log_test(f"Retrieve Submission ({student_name})", True, 
                                f"Status: {status}, ID: {submission_id[:8]}...")
                    
                    # Check evaluation if present
                    evaluation = submission.get('evaluation')
                    if evaluation:
                        total_score = evaluation.get('totalScore', 0)
                        max_score = evaluation.get('maxScore', 0)
                        self.log_test(f"AI Evaluation ({student_name})", True, 
                                    f"Score: {total_score}/{max_score}")
                    else:
                        self.log_test(f"AI Evaluation ({student_name})", True, 
                                    "Evaluation in progress or not started")
                    
                    success_count += 1
                    
                else:
                    self.log_test(f"Retrieve Submission {submission_id[:8]}...", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Retrieve Submission {submission_id[:8]}...", False, 
                            f"Exception: {str(e)}")
        
        return success_count == len(self.submission_ids)
    
    def run_form_submission_tests(self):
        """Main test execution for form submission fix verification"""
        print("🧪 FORM SUBMISSION FIX VERIFICATION")
        print("=" * 80)
        print(f"Testing API at: {self.base_url}")
        print(f"Test Focus: Verifying UUID field mapping fix for rubric selection")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Test 1: Verify rubric API field structure
        if not self.test_rubrics_field_structure():
            print("❌ Cannot proceed - Rubric API structure test failed")
            return False
        
        # Test 2: Test submissions with valid rubric UUID
        if not self.test_submission_with_valid_rubric_id():
            print("❌ Form submission test failed")
            return False
        
        # Test 3: Verify submission retrieval
        if not self.test_submission_retrieval():
            print("❌ Submission retrieval test failed")
            return False
        
        # Summary
        print("\n" + "=" * 80)
        print("🏁 FORM SUBMISSION FIX VERIFICATION COMPLETED")
        print("=" * 80)
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ Tests Passed: {passed_tests}/{total_tests}")
        
        if passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED - Form submission fix is working correctly!")
            print("✅ No UUID errors detected")
            print("✅ Rubric IDs are properly mapped and stored")
            print("✅ All submission types working with valid rubric UUIDs")
            return True
        else:
            print("❌ Some tests failed - Form submission fix needs attention")
            failed_tests = [r for r in self.test_results if not r['success']]
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
            return False

if __name__ == "__main__":
    tester = FormSubmissionTester()
    success = tester.run_form_submission_tests()
    
    if success:
        print("\n🎉 FORM SUBMISSION FIX VERIFICATION: SUCCESS")
        exit(0)
    else:
        print("\n❌ FORM SUBMISSION FIX VERIFICATION: FAILED")
        exit(1)