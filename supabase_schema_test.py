#!/usr/bin/env python3
"""
Supabase Schema Verification Test
Check if all required tables exist and have correct structure
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://code-submit-fix.preview.emergentagent.com/api"

def test_table_access(table_name, description):
    """Test if we can access a specific table"""
    try:
        if table_name == "submissions":
            response = requests.get(f"{BASE_URL}/submissions", timeout=10)
        elif table_name == "rubrics":
            response = requests.get(f"{BASE_URL}/rubrics", timeout=10)
        elif table_name == "evaluations":
            # Test by creating a submission and checking if evaluation is created
            return test_evaluation_table()
        else:
            print(f"❌ {description}: No API endpoint to test {table_name}")
            return False
            
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {description}: Table accessible, returned {len(data) if isinstance(data, list) else 1} records")
            return True
        else:
            print(f"❌ {description}: HTTP {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ {description}: Error - {str(e)}")
        return False

def test_evaluation_table():
    """Test evaluations table by checking if evaluations are being created"""
    try:
        # Get recent submissions and check if they have evaluations
        response = requests.get(f"{BASE_URL}/submissions", timeout=10)
        if response.status_code != 200:
            return False
            
        submissions = response.json()
        
        # Find a completed submission and check its evaluation
        for submission in submissions[:5]:
            if submission.get('status') == 'completed':
                submission_id = submission.get('id')
                detail_response = requests.get(f"{BASE_URL}/submissions/{submission_id}", timeout=10)
                
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    evaluation = detail_data.get('evaluation')
                    
                    if evaluation:
                        print(f"✅ Evaluations Table: Found evaluation data for submission {submission_id}")
                        return True
        
        print(f"❌ Evaluations Table: No evaluation data found in recent submissions")
        return False
        
    except Exception as e:
        print(f"❌ Evaluations Table: Error - {str(e)}")
        return False

def test_default_rubric_exists():
    """Test if default rubric exists"""
    try:
        response = requests.get(f"{BASE_URL}/rubrics", timeout=10)
        if response.status_code != 200:
            print(f"❌ Default Rubric Check: Cannot access rubrics - HTTP {response.status_code}")
            return False
            
        rubrics = response.json()
        
        if not rubrics:
            print(f"❌ Default Rubric Check: No rubrics found")
            return False
            
        # Look for default rubric
        default_rubrics = [r for r in rubrics if 'default' in r.get('title', '').lower()]
        
        if default_rubrics:
            rubric = default_rubrics[0]
            print(f"✅ Default Rubric Check: Found '{rubric.get('title')}' with {len(rubric.get('criteria', []))} criteria")
            return True
        else:
            print(f"❌ Default Rubric Check: No default rubric found (total rubrics: {len(rubrics)})")
            return False
            
    except Exception as e:
        print(f"❌ Default Rubric Check: Error - {str(e)}")
        return False

def test_data_types_and_structure():
    """Test if data types are correct (UUID vs ObjectID)"""
    try:
        # Create a test submission to verify UUID format
        rubric_response = requests.get(f"{BASE_URL}/rubrics", timeout=10)
        if rubric_response.status_code != 200:
            print(f"❌ Data Types Check: Cannot get rubrics")
            return False
            
        rubrics = rubric_response.json()
        if not rubrics:
            print(f"❌ Data Types Check: No rubrics available")
            return False
            
        rubric_id = rubrics[0]['id']
        
        # Check if rubric ID is UUID format (36 characters with hyphens)
        if len(rubric_id) == 36 and rubric_id.count('-') == 4:
            print(f"✅ Data Types Check: Rubric ID is UUID format: {rubric_id}")
        else:
            print(f"❌ Data Types Check: Rubric ID is not UUID format: {rubric_id}")
            return False
            
        # Check submission IDs
        submissions_response = requests.get(f"{BASE_URL}/submissions", timeout=10)
        if submissions_response.status_code == 200:
            submissions = submissions_response.json()
            if submissions:
                submission_id = submissions[0].get('id')
                if len(submission_id) == 36 and submission_id.count('-') == 4:
                    print(f"✅ Data Types Check: Submission ID is UUID format: {submission_id}")
                    return True
                else:
                    print(f"❌ Data Types Check: Submission ID is not UUID format: {submission_id}")
                    return False
        
        return True
        
    except Exception as e:
        print(f"❌ Data Types Check: Error - {str(e)}")
        return False

def main():
    print("=" * 60)
    print("SUPABASE SCHEMA VERIFICATION TEST")
    print("=" * 60)
    print()
    
    tests = [
        ("submissions", "Submissions Table"),
        ("rubrics", "Rubrics Table"),
        ("evaluations", "Evaluations Table"),
    ]
    
    results = []
    
    # Test table access
    for table, description in tests:
        result = test_table_access(table, description)
        results.append(result)
    
    print()
    
    # Test default rubric
    default_rubric_result = test_default_rubric_exists()
    results.append(default_rubric_result)
    
    print()
    
    # Test data types
    data_types_result = test_data_types_and_structure()
    results.append(data_types_result)
    
    print()
    print("=" * 60)
    print("SCHEMA VERIFICATION SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if passed == total:
        print("✅ All schema verification tests passed!")
        print("✅ Supabase migration appears to be successful")
    else:
        print("❌ Some schema issues detected")
        print("❌ Migration may need attention")

if __name__ == "__main__":
    main()