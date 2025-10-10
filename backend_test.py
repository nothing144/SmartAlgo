#!/usr/bin/env python3
"""
Backend Testing Script for Privacy Filter Fix
Tests the privacy filter implementation for submissions visibility
"""

import requests
import json
import time
import uuid
from typing import Dict, List, Any

# Configuration
BASE_URL = "https://sub-privacy-filter.preview.emergentagent.com/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

class PrivacyFilterTester:
    def __init__(self):
        self.test_results = []
        self.created_submissions = []
        self.test_users = [
            f"test_user_{uuid.uuid4().hex[:8]}",
            f"test_user_{uuid.uuid4().hex[:8]}"
        ]
        
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")

    def get_default_rubric(self) -> str:
        """Get default rubric ID for testing"""
        try:
            response = requests.get(f"{BASE_URL}/rubrics", headers=HEADERS, timeout=10)
            if response.status_code == 200:
                rubrics = response.json()
                # Find default rubric
                for rubric in rubrics:
                    if 'Default' in rubric.get('title', '') or rubric.get('isDefault', False):
                        return rubric['id']
                # If no default found, use first rubric
                if rubrics:
                    return rubrics[0]['id']
            return None
        except Exception as e:
            print(f"Error getting rubric: {e}")
            return None

    def create_test_submission(self, user_id: str, is_public: bool, submission_type: str = "algorithm") -> Dict:
        """Create a test submission with specified privacy setting"""
        rubric_id = self.get_default_rubric()
        if not rubric_id:
            raise Exception("No rubric available for testing")
            
        submission_data = {
            "submissionType": submission_type,
            "assignmentTitle": f"Privacy Test {submission_type.title()} - {'Public' if is_public else 'Private'}",
            "studentName": f"Test Student {user_id[:8]}",
            "textContent": f"def test_function():\n    # This is a test {submission_type}\n    return 'Hello World'",
            "rubricId": rubric_id,
            "userId": user_id,
            "isPublic": is_public
        }
        
        try:
            response = requests.post(f"{BASE_URL}/submissions", 
                                   json=submission_data, 
                                   headers=HEADERS, 
                                   timeout=30)
            
            if response.status_code == 200:
                submission = response.json()
                self.created_submissions.append(submission['submissionId'])
                return submission
            else:
                raise Exception(f"Failed to create submission: {response.status_code} - {response.text}")
                
        except Exception as e:
            raise Exception(f"Error creating submission: {e}")

    def test_submission_creation_with_privacy(self):
        """Test 1: Create test submissions with different privacy settings"""
        print("\n=== Test 1: Creating Test Submissions ===")
        
        try:
            # Create 2 public submissions with different users
            public_sub1 = self.create_test_submission(self.test_users[0], True, "algorithm")
            self.log_test("Create Public Algorithm Submission (User 1)", 
                         True, 
                         f"Created public submission: {public_sub1['submissionId']}")
            
            public_sub2 = self.create_test_submission(self.test_users[1], True, "pseudocode")
            self.log_test("Create Public Pseudocode Submission (User 2)", 
                         True, 
                         f"Created public submission: {public_sub2['submissionId']}")
            
            # Create 2 private submissions with different users
            private_sub1 = self.create_test_submission(self.test_users[0], False, "algorithm")
            self.log_test("Create Private Algorithm Submission (User 1)", 
                         True, 
                         f"Created private submission: {private_sub1['submissionId']}")
            
            private_sub2 = self.create_test_submission(self.test_users[1], False, "pseudocode")
            self.log_test("Create Private Pseudocode Submission (User 2)", 
                         True, 
                         f"Created private submission: {private_sub2['submissionId']}")
            
            # Store for later tests
            self.public_submissions = [public_sub1, public_sub2]
            self.private_submissions = [private_sub1, private_sub2]
            
        except Exception as e:
            self.log_test("Submission Creation", False, f"Failed to create test submissions: {e}")
            return False
            
        return True

    def test_public_submissions_endpoint(self):
        """Test 2: Verify GET /api/submissions only returns public submissions"""
        print("\n=== Test 2: Public Submissions Endpoint ===")
        
        try:
            response = requests.get(f"{BASE_URL}/submissions", headers=HEADERS, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Public Submissions API", False, 
                             f"API returned {response.status_code}: {response.text}")
                return False
            
            submissions = response.json()
            
            # Count public vs private submissions in response
            public_count = 0
            private_count = 0
            our_public_found = 0
            our_private_found = 0
            
            for submission in submissions:
                is_public = submission.get('isPublic', True)  # Default to True for compatibility
                if is_public:
                    public_count += 1
                else:
                    private_count += 1
                
                # Check if our test submissions are in the response
                if submission['submissionId'] in [s['submissionId'] for s in self.public_submissions]:
                    our_public_found += 1
                if submission['submissionId'] in [s['submissionId'] for s in self.private_submissions]:
                    our_private_found += 1
            
            # Verify no private submissions are returned
            if private_count == 0:
                self.log_test("No Private Submissions in Public Endpoint", True, 
                             f"✅ Correctly filtered out private submissions")
            else:
                self.log_test("No Private Submissions in Public Endpoint", False, 
                             f"Found {private_count} private submissions in public endpoint")
            
            # Verify our public submissions are included
            if our_public_found == len(self.public_submissions):
                self.log_test("Our Public Submissions Included", True, 
                             f"All {our_public_found} public test submissions found")
            else:
                self.log_test("Our Public Submissions Included", False, 
                             f"Only {our_public_found}/{len(self.public_submissions)} public submissions found")
            
            # Verify our private submissions are NOT included
            if our_private_found == 0:
                self.log_test("Our Private Submissions Excluded", True, 
                             f"✅ Private submissions correctly excluded from public view")
            else:
                self.log_test("Our Private Submissions Excluded", False, 
                             f"❌ Found {our_private_found} private submissions in public endpoint")
            
            self.log_test("Public Submissions Endpoint", True, 
                         f"Total submissions: {len(submissions)}, Public: {public_count}, Private: {private_count}")
            
            return private_count == 0 and our_private_found == 0
            
        except Exception as e:
            self.log_test("Public Submissions Endpoint", False, f"Error: {e}")
            return False

    def test_user_specific_submissions(self):
        """Test 3: Verify GET /api/submissions?userId=xxx returns all user submissions"""
        print("\n=== Test 3: User-Specific Submissions Endpoint ===")
        
        success = True
        
        for i, user_id in enumerate(self.test_users):
            try:
                response = requests.get(f"{BASE_URL}/submissions?userId={user_id}", 
                                      headers=HEADERS, timeout=10)
                
                if response.status_code != 200:
                    self.log_test(f"User {i+1} Submissions API", False, 
                                 f"API returned {response.status_code}: {response.text}")
                    success = False
                    continue
                
                submissions = response.json()
                
                # Count submissions for this user
                user_submissions = [s for s in submissions if s.get('userId') == user_id]
                public_count = sum(1 for s in user_submissions if s.get('isPublic', True))
                private_count = sum(1 for s in user_submissions if not s.get('isPublic', True))
                
                # We created 1 public and 1 private for each user
                expected_public = 1
                expected_private = 1
                
                if public_count >= expected_public and private_count >= expected_private:
                    self.log_test(f"User {i+1} All Submissions Retrieved", True, 
                                 f"Found {public_count} public + {private_count} private submissions")
                else:
                    self.log_test(f"User {i+1} All Submissions Retrieved", False, 
                                 f"Expected 1+1, found {public_count} public + {private_count} private")
                    success = False
                
            except Exception as e:
                self.log_test(f"User {i+1} Submissions Endpoint", False, f"Error: {e}")
                success = False
        
        return success

    def test_privacy_field_storage(self):
        """Test 4: Verify isPublic field is stored correctly in database"""
        print("\n=== Test 4: Privacy Field Storage Verification ===")
        
        success = True
        
        # Test each created submission
        all_test_submissions = self.public_submissions + self.private_submissions
        
        for submission in all_test_submissions:
            try:
                response = requests.get(f"{BASE_URL}/submissions/{submission['submissionId']}", 
                                      headers=HEADERS, timeout=10)
                
                if response.status_code != 200:
                    self.log_test(f"Retrieve Submission {submission['submissionId'][:8]}", False, 
                                 f"API returned {response.status_code}")
                    success = False
                    continue
                
                retrieved = response.json()
                expected_public = submission in self.public_submissions
                actual_public = retrieved.get('isPublic', True)
                
                if actual_public == expected_public:
                    self.log_test(f"Privacy Field Correct ({submission['submissionId'][:8]})", True, 
                                 f"isPublic={actual_public} as expected")
                else:
                    self.log_test(f"Privacy Field Incorrect ({submission['submissionId'][:8]})", False, 
                                 f"Expected isPublic={expected_public}, got {actual_public}")
                    success = False
                
            except Exception as e:
                self.log_test(f"Privacy Field Check ({submission['submissionId'][:8]})", False, f"Error: {e}")
                success = False
        
        return success

    def test_edge_cases(self):
        """Test 5: Edge cases - null/undefined isPublic values"""
        print("\n=== Test 5: Edge Cases ===")
        
        try:
            # Create submission without isPublic field (should default to true)
            rubric_id = self.get_default_rubric()
            submission_data = {
                "submissionType": "algorithm",
                "assignmentTitle": "Edge Case Test - No isPublic Field",
                "studentName": "Edge Case Tester",
                "textContent": "def edge_case():\n    return 'default public'",
                "rubricId": rubric_id,
                "userId": self.test_users[0]
                # Note: No isPublic field
            }
            
            response = requests.post(f"{BASE_URL}/submissions", 
                                   json=submission_data, 
                                   headers=HEADERS, 
                                   timeout=30)
            
            if response.status_code == 200:
                submission = response.json()
                self.created_submissions.append(submission['submissionId'])
                
                # Check if it defaults to public
                is_public = submission.get('isPublic', True)
                if is_public:
                    self.log_test("Default isPublic Behavior", True, 
                                 "Submission without isPublic field defaults to public")
                else:
                    self.log_test("Default isPublic Behavior", False, 
                                 f"Expected default public, got isPublic={is_public}")
                
                # Verify it appears in public submissions
                public_response = requests.get(f"{BASE_URL}/submissions", headers=HEADERS, timeout=10)
                if public_response.status_code == 200:
                    public_submissions = public_response.json()
                    found_in_public = any(s['submissionId'] == submission['submissionId'] 
                                        for s in public_submissions)
                    
                    if found_in_public:
                        self.log_test("Default Public Submission Visibility", True, 
                                     "Default submission appears in public list")
                    else:
                        self.log_test("Default Public Submission Visibility", False, 
                                     "Default submission missing from public list")
                
                return True
            else:
                self.log_test("Edge Case Creation", False, 
                             f"Failed to create edge case submission: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Edge Cases", False, f"Error: {e}")
            return False

    def test_combined_submissions_privacy(self):
        """Test 6: Combined submissions privacy handling"""
        print("\n=== Test 6: Combined Submissions Privacy ===")
        
        try:
            rubric_id = self.get_default_rubric()
            
            # Create a combined submission with privacy setting
            combined_data = {
                "submissionType": "combined",
                "title": "Privacy Test Combined Submission",
                "studentName": "Combined Tester",
                "algorithmContent": "def algorithm():\n    return 'combined test'",
                "pseudocodeContent": "BEGIN\n    PRINT 'combined test'\nEND",
                "flowchartFile": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                "rubricId": rubric_id,
                "userId": self.test_users[0],
                "isPublic": False  # Make it private
            }
            
            response = requests.post(f"{BASE_URL}/submissions", 
                                   json=combined_data, 
                                   headers=HEADERS, 
                                   timeout=60)  # Longer timeout for combined
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('type') == 'combined':
                    combined_id = result.get('combinedSubmissionId')
                    submissions = result.get('submissions', [])
                    
                    # Check that all 3 parts have the same privacy setting
                    privacy_consistent = all(not s.get('isPublic', True) for s in submissions)
                    
                    if privacy_consistent:
                        self.log_test("Combined Submissions Privacy Consistency", True, 
                                     "All 3 parts of combined submission have consistent privacy setting")
                    else:
                        self.log_test("Combined Submissions Privacy Consistency", False, 
                                     "Privacy settings inconsistent across combined submission parts")
                    
                    # Verify combined submission doesn't appear in public list
                    public_response = requests.get(f"{BASE_URL}/submissions", headers=HEADERS, timeout=10)
                    if public_response.status_code == 200:
                        public_submissions = public_response.json()
                        found_parts = sum(1 for s in public_submissions 
                                        if s['submissionId'] in [sub['submissionId'] for sub in submissions])
                        
                        if found_parts == 0:
                            self.log_test("Private Combined Submission Exclusion", True, 
                                         "Private combined submission parts correctly excluded from public view")
                        else:
                            self.log_test("Private Combined Submission Exclusion", False, 
                                         f"Found {found_parts} parts of private combined submission in public view")
                    
                    return privacy_consistent and found_parts == 0
                else:
                    self.log_test("Combined Submission Creation", False, 
                                 f"Expected combined type, got: {result.get('type')}")
                    return False
            else:
                self.log_test("Combined Submission Creation", False, 
                             f"Failed to create combined submission: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Combined Submissions Privacy", False, f"Error: {e}")
            return False

    def run_all_tests(self):
        """Run all privacy filter tests"""
        print("🔒 PRIVACY FILTER TESTING STARTED")
        print("=" * 50)
        
        # Test 1: Create test data
        if not self.test_submission_creation_with_privacy():
            print("❌ Failed to create test data - aborting remaining tests")
            return False
        
        # Test 2: Public submissions endpoint
        self.test_public_submissions_endpoint()
        
        # Test 3: User-specific submissions
        self.test_user_specific_submissions()
        
        # Test 4: Privacy field storage
        self.test_privacy_field_storage()
        
        # Test 5: Edge cases
        self.test_edge_cases()
        
        # Test 6: Combined submissions
        self.test_combined_submissions_privacy()
        
        # Summary
        self.print_summary()
        
        return self.calculate_success_rate() > 0.8  # 80% success threshold

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("🔒 PRIVACY FILTER TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['message']}")
        
        # Show critical privacy violations
        critical_failures = [
            result for result in self.test_results 
            if not result['success'] and any(keyword in result['test'].lower() 
                                           for keyword in ['private', 'exclusion', 'privacy'])
        ]
        
        if critical_failures:
            print(f"\n🚨 CRITICAL PRIVACY VIOLATIONS ({len(critical_failures)}):")
            for test in critical_failures:
                print(f"   • {test['test']}: {test['message']}")
        
        print(f"\n📊 Created {len(self.created_submissions)} test submissions")
        print(f"👥 Used {len(self.test_users)} test users")

    def calculate_success_rate(self):
        """Calculate overall success rate"""
        if not self.test_results:
            return 0
        passed = sum(1 for result in self.test_results if result['success'])
        return passed / len(self.test_results)

def main():
    """Main test execution"""
    tester = PrivacyFilterTester()
    
    try:
        success = tester.run_all_tests()
        
        if success:
            print("\n✅ PRIVACY FILTER TESTS COMPLETED SUCCESSFULLY")
            exit(0)
        else:
            print("\n❌ PRIVACY FILTER TESTS FAILED")
            exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {e}")
        exit(1)

if __name__ == "__main__":
    main()