from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_signup_updates_activity_participants():
    activity_name = "Basketball Team"
    participant_email = "newstudent@mergington.edu"

    response = client.post(f"/activities/{activity_name}/signup?email={participant_email}")

    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {participant_email} for {activity_name}"

    activities_response = client.get("/activities")
    activity = activities_response.json()[activity_name]
    assert participant_email in activity["participants"]

    # Restore state for future tests.
    client.delete(f"/activities/{activity_name}/participants/{participant_email}")


def test_unregister_participant_from_activity():
    activity_name = "Chess Club"
    participant_email = "michael@mergington.edu"

    response = client.delete(f"/activities/{activity_name}/participants/{participant_email}")

    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {participant_email} from {activity_name}"

    activities_response = client.get("/activities")
    activity = activities_response.json()[activity_name]
    assert participant_email not in activity["participants"]

    # Restore state for future tests.
    client.post(f"/activities/{activity_name}/signup?email={participant_email}")
