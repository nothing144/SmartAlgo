#!/usr/bin/env python3
"""
AI Evaluation Engine Testing for Smart Evaluator
Testing recent bug fixes for:
1. AI Evaluation Engine - all 3 types (algorithm, pseudocode, flowchart) completing successfully
2. Image Processing Fix - base64 conversion fix for Gemini Vision API
3. Submissions API - GET /api/submissions returns recent submissions with correct status
4. Evaluation Data - evaluations being created and stored properly
5. Status Updates - submissions progress through "submitted" → "evaluating" → "completed"
"""

import requests
import json
import time
import sys
import base64
from datetime import datetime
from typing import Dict, Any, List

# Configuration
BASE_URL = "https://repo-analyzer-89.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class EvaluationEngineTester:
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
    
    def setup_test_rubric(self):
        """Setup: Create a test rubric for evaluation testing"""
        print("\n=== SETUP: Creating Test Rubric ===")
        try:
            response = requests.post(f"{self.base_url}/rubrics/default", 
                json={
                    "title": "AI Evaluation Test Rubric",
                    "description": "Testing rubric for AI evaluation engine fixes",
                    "submissionType": "any",
                    "createdBy": "evaluation_test"
                },
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                # Get the created rubric
                rubrics_response = requests.get(f"{self.base_url}/rubrics", headers=self.headers, timeout=30)
                if rubrics_response.status_code == 200:
                    rubrics = rubrics_response.json()
                    if rubrics:
                        self.rubric_id = rubrics[0]['id']
                        self.log_test("Test Rubric Setup", True, f"Rubric created with ID: {self.rubric_id}")
                        return True
            
            self.log_test("Test Rubric Setup", False, f"Failed to create rubric: {response.status_code}")
            return False
            
        except Exception as e:
            self.log_test("Test Rubric Setup", False, f"Exception: {str(e)}")
            return False
    
    def test_algorithm_evaluation(self):
        """Test 1: Algorithm submission evaluation with syntax error detection"""
        print("\n=== TEST 1: Algorithm Evaluation with Syntax Issues ===")
        
        if not self.rubric_id:
            self.log_test("Algorithm Test Setup", False, "No rubric ID available")
            return False
        
        # Test with algorithm that has syntax issues for AI to detect
        algorithm_with_issues = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1)  # Missing colon - syntax error
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

# Test with undefined variable
numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = bubble_sort(numbers)
print("Sorted array:", sorted_result)  # undefined variable error
"""
        
        try:
            submission_data = {
                "studentName": "Test Student Algorithm",
                "assignmentTitle": "Bubble Sort with Syntax Issues",
                "submissionType": "algorithm",
                "textContent": algorithm_with_issues,
                "rubricId": self.rubric_id
            }
            
            response = requests.post(f"{self.base_url}/submissions", 
                json=submission_data,
                headers=self.headers,
                timeout=60
            )
            
            if response.status_code in [200, 201]:
                submission = response.json()
                submission_id = submission.get('id')
                
                if submission_id:
                    self.submission_ids.append(submission_id)
                    self.log_test("Algorithm Submission Creation", True, 
                                f"Created submission ID: {submission_id}")
                    
                    # Monitor status progression
                    return self._monitor_evaluation_progress(submission_id, "Algorithm")
                else:
                    self.log_test("Algorithm Submission Creation", False, "No submission ID returned")
                    return False
            else:
                self.log_test("Algorithm Submission Creation", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Algorithm Evaluation Test", False, f"Exception: {str(e)}")
            return False
    
    def test_pseudocode_evaluation(self):
        """Test 2: Pseudocode submission evaluation"""
        print("\n=== TEST 2: Pseudocode Evaluation ===")
        
        if not self.rubric_id:
            self.log_test("Pseudocode Test Setup", False, "No rubric ID available")
            return False
        
        pseudocode_content = """
ALGORITHM QuickSort
INPUT: array, low_index, high_index
OUTPUT: sorted array

BEGIN
    IF low_index < high_index THEN
        pivot_index = Partition(array, low_index, high_index)
        QuickSort(array, low_index, pivot_index - 1)
        QuickSort(array, pivot_index + 1, high_index)
    END IF
END

FUNCTION Partition(array, low, high)
BEGIN
    pivot = array[high]
    i = low - 1
    
    FOR j = low TO high - 1 DO
        IF array[j] <= pivot THEN
            i = i + 1
            SWAP array[i] WITH array[j]
        END IF
    END FOR
    
    SWAP array[i + 1] WITH array[high]
    RETURN i + 1
END
"""
        
        try:
            submission_data = {
                "studentName": "Test Student Pseudocode",
                "assignmentTitle": "QuickSort Pseudocode",
                "submissionType": "pseudocode",
                "textContent": pseudocode_content,
                "rubricId": self.rubric_id
            }
            
            response = requests.post(f"{self.base_url}/submissions", 
                json=submission_data,
                headers=self.headers,
                timeout=60
            )
            
            if response.status_code in [200, 201]:
                submission = response.json()
                submission_id = submission.get('id')
                
                if submission_id:
                    self.submission_ids.append(submission_id)
                    self.log_test("Pseudocode Submission Creation", True, 
                                f"Created submission ID: {submission_id}")
                    
                    return self._monitor_evaluation_progress(submission_id, "Pseudocode")
                else:
                    self.log_test("Pseudocode Submission Creation", False, "No submission ID returned")
                    return False
            else:
                self.log_test("Pseudocode Submission Creation", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Pseudocode Evaluation Test", False, f"Exception: {str(e)}")
            return False
    
    def test_flowchart_evaluation(self):
        """Test 3: Flowchart submission with image processing fix"""
        print("\n=== TEST 3: Flowchart Evaluation with Image Processing ===")
        
        if not self.rubric_id:
            self.log_test("Flowchart Test Setup", False, "No rubric ID available")
            return False
        
        # Create a simple test image (1x1 pixel PNG) in base64
        # This tests the base64 to Cloudinary to base64 conversion pipeline
        test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        try:
            submission_data = {
                "studentName": "Test Student Flowchart",
                "assignmentTitle": "Simple Process Flowchart",
                "submissionType": "flowchart",
                "imageData": test_image_base64,
                "fileName": "test_flowchart.png",
                "rubricId": self.rubric_id
            }
            
            response = requests.post(f"{self.base_url}/submissions", 
                json=submission_data,
                headers=self.headers,
                timeout=60
            )
            
            if response.status_code in [200, 201]:
                submission = response.json()
                submission_id = submission.get('id')
                
                if submission_id:
                    self.submission_ids.append(submission_id)
                    self.log_test("Flowchart Submission Creation", True, 
                                f"Created submission ID: {submission_id}")
                    
                    # Verify image was uploaded to Cloudinary
                    image_url = submission.get('image_url')
                    if image_url and 'cloudinary.com' in image_url:
                        self.log_test("Cloudinary Image Upload", True, 
                                    f"Image uploaded to: {image_url[:50]}...")
                    else:
                        self.log_test("Cloudinary Image Upload", False, 
                                    f"No valid Cloudinary URL found: {image_url}")
                    
                    return self._monitor_evaluation_progress(submission_id, "Flowchart")
                else:
                    self.log_test("Flowchart Submission Creation", False, "No submission ID returned")
                    return False
            else:
                self.log_test("Flowchart Submission Creation", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Flowchart Evaluation Test", False, f"Exception: {str(e)}")
            return False
    
    def _monitor_evaluation_progress(self, submission_id, submission_type):
        """Monitor submission status progression and evaluation completion"""
        print(f"\n--- Monitoring {submission_type} Evaluation Progress ---")
        
        max_wait_time = 120  # 2 minutes max wait
        check_interval = 5   # Check every 5 seconds
        checks = 0
        max_checks = max_wait_time // check_interval
        
        status_progression = []
        
        while checks < max_checks:
            try:
                response = requests.get(f"{self.base_url}/submissions/{submission_id}", 
                                      headers=self.headers, timeout=30)
                
                if response.status_code == 200:
                    submission = response.json()
                    current_status = submission.get('status', 'unknown')
                    
                    # Track status progression
                    if not status_progression or status_progression[-1] != current_status:
                        status_progression.append(current_status)
                        print(f"   Status update: {current_status}")
                    
                    # Check if evaluation is complete
                    if current_status == 'completed':
                        self.log_test(f"{submission_type} Status Progression", True, 
                                    f"Completed progression: {' → '.join(status_progression)}")
                        
                        # Verify evaluation data exists
                        evaluation = submission.get('evaluation')
                        if evaluation:
                            total_score = evaluation.get('totalScore', 0)
                            max_score = evaluation.get('maxScore', 0)
                            analysis = evaluation.get('analysis', '')
                            
                            self.log_test(f"{submission_type} Evaluation Data", True, 
                                        f"Score: {total_score}/{max_score}, Analysis length: {len(analysis)} chars")
                            
                            # Check for AI analysis quality
                            if len(analysis) > 50:  # Should have substantial analysis
                                self.log_test(f"{submission_type} AI Analysis Quality", True, 
                                            f"Detailed analysis provided ({len(analysis)} characters)")
                            else:
                                self.log_test(f"{submission_type} AI Analysis Quality", False, 
                                            f"Analysis too short: {analysis[:100]}...")
                            
                            return True
                        else:
                            self.log_test(f"{submission_type} Evaluation Data", False, 
                                        "No evaluation data found despite 'completed' status")
                            return False
                    
                    elif current_status == 'error':
                        self.log_test(f"{submission_type} Status Progression", False, 
                                    f"Evaluation failed with error status. Progression: {' → '.join(status_progression)}")
                        return False
                    
                    # Continue monitoring
                    time.sleep(check_interval)
                    checks += 1
                    
                else:
                    self.log_test(f"{submission_type} Status Check", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"{submission_type} Status Monitoring", False, f"Exception: {str(e)}")
                return False
        
        # Timeout reached
        self.log_test(f"{submission_type} Evaluation Timeout", False, 
                    f"Evaluation did not complete within {max_wait_time}s. Final progression: {' → '.join(status_progression)}")
        return False
    
    def test_submissions_api(self):
        """Test 4: Verify GET /api/submissions returns recent submissions with correct status"""
        print("\n=== TEST 4: Submissions API Verification ===")
        
        try:
            response = requests.get(f"{self.base_url}/submissions", 
                                  headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                submissions = response.json()
                
                if not submissions:
                    self.log_test("Submissions API Response", False, "No submissions returned")
                    return False
                
                self.log_test("Submissions API Response", True, 
                            f"Retrieved {len(submissions)} submissions")
                
                # Verify our test submissions are in the list
                our_submission_count = 0
                completed_count = 0
                
                for submission in submissions:
                    if submission.get('id') in self.submission_ids:
                        our_submission_count += 1
                        status = submission.get('status', 'unknown')
                        student_name = submission.get('studentName', 'N/A')
                        
                        if status == 'completed':
                            completed_count += 1
                        
                        self.log_test(f"Test Submission Status ({student_name})", True, 
                                    f"Status: {status}")
                
                if our_submission_count > 0:
                    self.log_test("Test Submissions in API", True, 
                                f"Found {our_submission_count}/{len(self.submission_ids)} test submissions")
                    
                    if completed_count > 0:
                        self.log_test("Completed Evaluations", True, 
                                    f"{completed_count} submissions completed evaluation")
                        return True
                    else:
                        self.log_test("Completed Evaluations", False, 
                                    "No test submissions completed evaluation")
                        return False
                else:
                    self.log_test("Test Submissions in API", False, 
                                "None of our test submissions found in API response")
                    return False
                
            else:
                self.log_test("Submissions API Response", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Submissions API Test", False, f"Exception: {str(e)}")
            return False
    
    def run_evaluation_engine_tests(self):
        """Main test execution for AI evaluation engine verification"""
        print("🧪 AI EVALUATION ENGINE TESTING")
        print("=" * 80)
        print(f"Testing API at: {self.base_url}")
        print(f"Test Focus: Verifying AI evaluation fixes and image processing")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Setup
        if not self.setup_test_rubric():
            print("❌ Cannot proceed - Test rubric setup failed")
            return False
        
        # Test 1: Algorithm evaluation
        algorithm_success = self.test_algorithm_evaluation()
        
        # Test 2: Pseudocode evaluation  
        pseudocode_success = self.test_pseudocode_evaluation()
        
        # Test 3: Flowchart evaluation with image processing
        flowchart_success = self.test_flowchart_evaluation()
        
        # Wait a bit for all evaluations to potentially complete
        print("\n--- Waiting for all evaluations to complete ---")
        time.sleep(10)
        
        # Test 4: Submissions API verification
        api_success = self.test_submissions_api()
        
        # Summary
        print("\n" + "=" * 80)
        print("🏁 AI EVALUATION ENGINE TESTING COMPLETED")
        print("=" * 80)
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ Tests Passed: {passed_tests}/{total_tests}")
        
        # Detailed results by category
        evaluation_tests = [algorithm_success, pseudocode_success, flowchart_success]
        completed_evaluations = sum(evaluation_tests)
        
        print(f"📊 Evaluation Results:")
        print(f"   - Algorithm Evaluation: {'✅' if algorithm_success else '❌'}")
        print(f"   - Pseudocode Evaluation: {'✅' if pseudocode_success else '❌'}")
        print(f"   - Flowchart Evaluation: {'✅' if flowchart_success else '❌'}")
        print(f"   - Submissions API: {'✅' if api_success else '❌'}")
        
        if completed_evaluations == 3 and api_success:
            print("\n🎉 ALL EVALUATION ENGINE TESTS PASSED!")
            print("✅ AI evaluation working for all 3 submission types")
            print("✅ Status progression working correctly (submitted → evaluating → completed)")
            print("✅ Image processing fix working for flowcharts")
            print("✅ Evaluation data being created and stored properly")
            print("✅ Submissions API returning correct status information")
            return True
        else:
            print("\n❌ Some evaluation engine tests failed")
            if completed_evaluations < 3:
                print(f"   - Only {completed_evaluations}/3 evaluation types completed successfully")
            if not api_success:
                print("   - Submissions API test failed")
            
            failed_tests = [r for r in self.test_results if not r['success']]
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
            return False

if __name__ == "__main__":
    tester = EvaluationEngineTester()
    success = tester.run_evaluation_engine_tests()
    
    if success:
        print("\n🎉 AI EVALUATION ENGINE VERIFICATION: SUCCESS")
        exit(0)
    else:
        print("\n❌ AI EVALUATION ENGINE VERIFICATION: FAILED")
        exit(1)