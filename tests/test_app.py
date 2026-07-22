import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(copy.deepcopy(original))


def test_signup_updates_activity_participants():
    # Arrange
    activity_name = "Basketball Team"
    participant_email = "newstudent@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup?email={participant_email}")

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {participant_email} for {activity_name}"

    activities_response = client.get("/activities")
    activity = activities_response.json()[activity_name]
    assert participant_email in activity["participants"]


def test_unregister_participant_from_activity():
    # Arrange
    activity_name = "Chess Club"
    participant_email = "michael@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants/{participant_email}")

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {participant_email} from {activity_name}"

    activities_response = client.get("/activities")
    activity = activities_response.json()[activity_name]
    assert participant_email not in activity["participants"]


def test_duplicate_signup_is_rejected():
    # Arrange
    activity_name = "Basketball Team"
    participant_email = "newstudent@mergington.edu"

    # Act
    first_response = client.post(f"/activities/{activity_name}/signup?email={participant_email}")
    second_response = client.post(f"/activities/{activity_name}/signup?email={participant_email}")

    # Assert
    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Student is already signed up for this activity"
