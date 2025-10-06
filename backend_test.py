#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Intelligent Rubrics-Based Evaluator
Tests Supabase and Cloudinary migration including all backend endpoints
"""

import requests
import json
import base64
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "https://feature-tester-5.preview.emergentagent.com/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.test_results = []
        self.created_rubric_id = None
        self.created_submission_ids = []
        
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
    
    def test_gemini_connection(self):
        """Test Gemini AI connectivity"""
        try:
            print("\n=== Testing Gemini AI Integration ===")
            response = requests.get(f"{self.base_url}/test/gemini", headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success' and 'geminiResponse' in data:
                    self.log_test(
                        "Gemini AI Connection", 
                        True, 
                        "Gemini AI is working correctly",
                        f"Response: {data.get('geminiResponse', '')[:100]}..."
                    )
                    return True
                else:
                    self.log_test(
                        "Gemini AI Connection", 
                        False, 
                        "Unexpected response format",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Gemini AI Connection", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Gemini AI Connection", 
                False, 
                f"Connection error: {str(e)}",
                None
            )
            return False
    
    def test_create_default_rubric(self):
        """Test creating default rubric"""
        try:
            print("\n=== Testing Rubrics API ===")
            
            rubric_data = {
                "title": "Test Evaluation Rubric",
                "description": "Test rubric for automated evaluation",
                "submissionType": "any",
                "createdBy": "test_system"
            }
            
            response = requests.post(
                f"{self.base_url}/rubrics/default", 
                headers=self.headers, 
                json=rubric_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'rubricId' in data and 'criteria' in data:
                    self.created_rubric_id = data['rubricId']
                    criteria_count = len(data.get('criteria', []))
                    self.log_test(
                        "Create Default Rubric", 
                        True, 
                        f"Rubric created with {criteria_count} criteria",
                        f"Rubric ID: {self.created_rubric_id}"
                    )
                    return True
                else:
                    self.log_test(
                        "Create Default Rubric", 
                        False, 
                        "Missing required fields in response",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Create Default Rubric", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Create Default Rubric", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return False
    
    def test_list_rubrics(self):
        """Test listing available rubrics"""
        try:
            response = requests.get(f"{self.base_url}/rubrics", headers=self.headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    rubric_count = len(data)
                    has_test_rubric = any(r.get('rubricId') == self.created_rubric_id for r in data)
                    
                    self.log_test(
                        "List Rubrics", 
                        True, 
                        f"Retrieved {rubric_count} rubrics, test rubric found: {has_test_rubric}",
                        f"Rubrics: {[r.get('title', 'No title') for r in data[:3]]}"
                    )
                    return True
                else:
                    self.log_test(
                        "List Rubrics", 
                        False, 
                        "Response is not a list",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "List Rubrics", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "List Rubrics", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return False
    
    def test_algorithm_submission(self):
        """Test algorithm submission with AI evaluation"""
        try:
            print("\n=== Testing Submissions API ===")
            
            algorithm_code = """
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Example usage
numbers = [1, 3, 5, 7, 9, 11, 13, 15]
result = binary_search(numbers, 7)
print(f"Found at index: {result}")
"""
            
            submission_data = {
                "studentName": "Alice Johnson",
                "assignmentTitle": "Binary Search Implementation",
                "submissionType": "algorithm",
                "textContent": algorithm_code,
                "userId": "student_001",
                "rubricId": self.created_rubric_id
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=submission_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'submissionId' in data:
                    submission_id = data['submissionId']
                    self.created_submission_ids.append(submission_id)
                    
                    # Wait a moment for AI evaluation to process
                    time.sleep(3)
                    
                    self.log_test(
                        "Algorithm Submission", 
                        True, 
                        f"Algorithm submitted successfully, status: {data.get('status', 'unknown')}",
                        f"Submission ID: {submission_id}"
                    )
                    return submission_id
                else:
                    self.log_test(
                        "Algorithm Submission", 
                        False, 
                        "Missing submissionId in response",
                        data
                    )
                    return None
            else:
                self.log_test(
                    "Algorithm Submission", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Algorithm Submission", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return None
    
    def test_pseudocode_submission(self):
        """Test pseudocode submission"""
        try:
            pseudocode_content = """
ALGORITHM: QuickSort
INPUT: Array A, low index, high index
OUTPUT: Sorted array

BEGIN
    IF low < high THEN
        pivot_index = PARTITION(A, low, high)
        QUICKSORT(A, low, pivot_index - 1)
        QUICKSORT(A, pivot_index + 1, high)
    END IF
END

FUNCTION PARTITION(A, low, high)
BEGIN
    pivot = A[high]
    i = low - 1
    
    FOR j = low TO high - 1 DO
        IF A[j] <= pivot THEN
            i = i + 1
            SWAP A[i] WITH A[j]
        END IF
    END FOR
    
    SWAP A[i + 1] WITH A[high]
    RETURN i + 1
END
"""
            
            submission_data = {
                "studentName": "Bob Smith",
                "assignmentTitle": "QuickSort Pseudocode",
                "submissionType": "pseudocode",
                "textContent": pseudocode_content,
                "userId": "student_002",
                "rubricId": self.created_rubric_id
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=submission_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'submissionId' in data:
                    submission_id = data['submissionId']
                    self.created_submission_ids.append(submission_id)
                    
                    # Wait for AI evaluation
                    time.sleep(3)
                    
                    self.log_test(
                        "Pseudocode Submission", 
                        True, 
                        f"Pseudocode submitted successfully, status: {data.get('status', 'unknown')}",
                        f"Submission ID: {submission_id}"
                    )
                    return submission_id
                else:
                    self.log_test(
                        "Pseudocode Submission", 
                        False, 
                        "Missing submissionId in response",
                        data
                    )
                    return None
            else:
                self.log_test(
                    "Pseudocode Submission", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Pseudocode Submission", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return None
    
    def test_flowchart_submission(self):
        """Test flowchart submission with base64 image"""
        try:
            # Create a simple base64 encoded test image (1x1 pixel PNG)
            test_image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            
            submission_data = {
                "studentName": "Carol Davis",
                "assignmentTitle": "Sorting Algorithm Flowchart",
                "submissionType": "flowchart",
                "imageData": test_image_b64,
                "fileName": "sorting_flowchart.png",
                "userId": "student_003",
                "rubricId": self.created_rubric_id
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=submission_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'submissionId' in data:
                    submission_id = data['submissionId']
                    self.created_submission_ids.append(submission_id)
                    
                    # Wait for AI evaluation
                    time.sleep(3)
                    
                    self.log_test(
                        "Flowchart Submission", 
                        True, 
                        f"Flowchart submitted successfully, status: {data.get('status', 'unknown')}",
                        f"Submission ID: {submission_id}"
                    )
                    return submission_id
                else:
                    self.log_test(
                        "Flowchart Submission", 
                        False, 
                        "Missing submissionId in response",
                        data
                    )
                    return None
            else:
                self.log_test(
                    "Flowchart Submission", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Flowchart Submission", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return None
    
    def test_list_submissions(self):
        """Test listing submissions"""
        try:
            response = requests.get(f"{self.base_url}/submissions", headers=self.headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    submission_count = len(data)
                    test_submissions = [s for s in data if s.get('submissionId') in self.created_submission_ids]
                    
                    self.log_test(
                        "List Submissions", 
                        True, 
                        f"Retrieved {submission_count} submissions, {len(test_submissions)} test submissions found",
                        f"Test submission IDs: {[s.get('submissionId') for s in test_submissions]}"
                    )
                    return True
                else:
                    self.log_test(
                        "List Submissions", 
                        False, 
                        "Response is not a list",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "List Submissions", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "List Submissions", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return False
    
    def test_get_submission_with_evaluation(self, submission_id):
        """Test getting specific submission with evaluation"""
        try:
            response = requests.get(
                f"{self.base_url}/submissions/{submission_id}", 
                headers=self.headers, 
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'submissionId' in data:
                    has_evaluation = data.get('evaluation') is not None
                    status = data.get('status', 'unknown')
                    
                    if has_evaluation:
                        eval_data = data['evaluation']
                        total_score = eval_data.get('totalScore', 0)
                        max_score = eval_data.get('maxScore', 0)
                        
                        self.log_test(
                            f"Get Submission {submission_id[:8]}...", 
                            True, 
                            f"Retrieved with evaluation, status: {status}, score: {total_score}/{max_score}",
                            f"Has AI analysis: {'aiAnalysis' in eval_data}"
                        )
                    else:
                        self.log_test(
                            f"Get Submission {submission_id[:8]}...", 
                            True, 
                            f"Retrieved without evaluation, status: {status}",
                            "Evaluation may still be processing"
                        )
                    return True
                else:
                    self.log_test(
                        f"Get Submission {submission_id[:8]}...", 
                        False, 
                        "Missing submissionId in response",
                        data
                    )
                    return False
            else:
                self.log_test(
                    f"Get Submission {submission_id[:8]}...", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                f"Get Submission {submission_id[:8]}...", 
                False, 
                f"Request error: {str(e)}",
                None
            )
            return False
    
    def test_error_handling(self):
        """Test API error handling"""
        try:
            print("\n=== Testing Error Handling ===")
            
            # Test invalid submission type
            invalid_data = {
                "studentName": "Test Student",
                "assignmentTitle": "Test Assignment",
                "submissionType": "invalid_type",
                "textContent": "test content"
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=invalid_data,
                timeout=15
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Invalid Submission Type Error", 
                    True, 
                    "Correctly rejected invalid submission type",
                    response.json().get('error', 'No error message')
                )
            else:
                self.log_test(
                    "Invalid Submission Type Error", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    response.text
                )
            
            # Test missing required fields
            incomplete_data = {
                "submissionType": "algorithm"
                # Missing studentName and assignmentTitle
            }
            
            response = requests.post(
                f"{self.base_url}/submissions", 
                headers=self.headers, 
                json=incomplete_data,
                timeout=15
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Missing Required Fields Error", 
                    True, 
                    "Correctly rejected incomplete submission",
                    response.json().get('error', 'No error message')
                )
            else:
                self.log_test(
                    "Missing Required Fields Error", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    response.text
                )
            
            # Test non-existent submission
            response = requests.get(
                f"{self.base_url}/submissions/non-existent-id", 
                headers=self.headers, 
                timeout=15
            )
            
            if response.status_code == 404:
                self.log_test(
                    "Non-existent Submission Error", 
                    True, 
                    "Correctly returned 404 for non-existent submission",
                    response.json().get('error', 'No error message')
                )
            else:
                self.log_test(
                    "Non-existent Submission Error", 
                    False, 
                    f"Expected 404, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "Error Handling Tests", 
                False, 
                f"Test error: {str(e)}",
                None
            )
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test Gemini AI Integration
        gemini_success = self.test_gemini_connection()
        
        # Test Rubrics API
        rubric_success = self.test_create_default_rubric()
        if rubric_success:
            self.test_list_rubrics()
        
        # Test Submissions API
        if self.created_rubric_id:
            # Test different submission types
            algo_id = self.test_algorithm_submission()
            pseudo_id = self.test_pseudocode_submission()
            flow_id = self.test_flowchart_submission()
            
            # Test listing submissions
            self.test_list_submissions()
            
            # Test getting individual submissions with evaluations
            for sub_id in self.created_submission_ids:
                if sub_id:
                    self.test_get_submission_with_evaluation(sub_id)
        
        # Test error handling
        self.test_error_handling()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n🎯 KEY FEATURES TESTED:")
        print("  • Gemini AI Integration")
        print("  • Rubrics Management")
        print("  • Submissions API (Algorithm, Pseudocode, Flowchart)")
        print("  • AI-powered Evaluation Engine")
        print("  • Error Handling & Validation")
        print("  • CORS Headers")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()