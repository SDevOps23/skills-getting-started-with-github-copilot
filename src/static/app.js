document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";
    activityCard.dataset.activityName = name;

    const participants = details.participants || [];
    const spotsLeft = Math.max(details.max_participants - participants.length, 0);

    activityCard.innerHTML = `
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p><strong>Schedule:</strong> ${details.schedule}</p>
      <p class="availability"><strong>Availability:</strong> <span class="availability-count">${spotsLeft}</span> spots left</p>
      <div class="participants-section">
        <h5>Participants</h5>
        <ul class="participants-list">
          ${
            participants.length
              ? participants
                  .map(
                    (participant) => `
                      <li class="participant-item">
                        <span class="participant-email">${participant}</span>
                        <button
                          type="button"
                          class="participant-delete-btn"
                          data-activity="${name}"
                          data-email="${participant}"
                          aria-label="Remove ${participant}"
                          title="Remove participant"
                        >🗑</button>
                      </li>
                    `
                  )
                  .join("")
              : "<li class='empty'>No participants yet.</li>"
          }
        </ul>
      </div>
    `;

    return activityCard;
  }

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      activitiesList.appendChild(renderActivityCard(name, details));

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete-btn");
    if (!deleteButton) {
      return;
    }

    const activityName = deleteButton.dataset.activity;
    const participantEmail = deleteButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(participantEmail)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        const activityCard = activitiesList.querySelector(
          `[data-activity-name="${activityName}"]`
        );
        if (activityCard) {
          const participantsList = activityCard.querySelector(".participants-list");
          const availabilityCount = activityCard.querySelector(".availability-count");
          const currentParticipants = Array.from(participantsList.querySelectorAll(".participant-item"));

          const participantExists = currentParticipants.some(
            (item) => item.querySelector(".participant-email")?.textContent === participantEmail
          );

          if (!participantExists) {
            participantsList.querySelector(".empty")?.remove();
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";
            participantItem.innerHTML = `
              <span class="participant-email">${participantEmail}</span>
              <button
                type="button"
                class="participant-delete-btn"
                data-activity="${activityName}"
                data-email="${participantEmail}"
                aria-label="Remove ${participantEmail}"
                title="Remove participant"
              >🗑</button>
            `;
            participantsList.appendChild(participantItem);
          }

          if (availabilityCount) {
            const currentCount = Number(availabilityCount.textContent);
            availabilityCount.textContent = Math.max(currentCount - 1, 0);
          }
        }

        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Unable to remove participant";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        const activityCard = activitiesList.querySelector(
          `[data-activity-name="${activity}"]`
        );
        if (activityCard) {
          const participantsList = activityCard.querySelector(".participants-list");
          const availabilityCount = activityCard.querySelector(".availability-count");

          participantsList.querySelector(".empty")?.remove();
          const participantItem = document.createElement("li");
          participantItem.className = "participant-item";
          participantItem.innerHTML = `
            <span class="participant-email">${email}</span>
            <button
              type="button"
              class="participant-delete-btn"
              data-activity="${activity}"
              data-email="${email}"
              aria-label="Remove ${email}"
              title="Remove participant"
            >🗑</button>
          `;
          participantsList.appendChild(participantItem);

          if (availabilityCount) {
            const currentCount = Number(availabilityCount.textContent);
            availabilityCount.textContent = Math.max(currentCount - 1, 0);
          }
        }

        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
