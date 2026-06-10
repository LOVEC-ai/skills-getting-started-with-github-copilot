document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function resetActivitySelect() {
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
  }

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    resetActivitySelect();

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participants = Array.isArray(details.participants) ? details.participants : [];

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
      `;

      const participantsSection = document.createElement("div");
      participantsSection.className = "participants-section";

      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = "Participants";
      participantsSection.appendChild(participantsHeading);

      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";

      if (participants.length > 0) {
        participants.forEach((participant) => {
          const listItem = document.createElement("li");

          const participantName = document.createElement("span");
          participantName.className = "participant-name";
          participantName.textContent = participant;

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "participant-remove";
          removeButton.setAttribute("aria-label", `Remove ${participant} from ${name}`);
          removeButton.title = `Remove ${participant}`;
          removeButton.textContent = "×";

          removeButton.addEventListener("click", async () => {
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                {
                  method: "DELETE",
                }
              );

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Failed to remove participant");
              }

              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              messageDiv.classList.remove("hidden");
              fetchActivities();

              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            } catch (error) {
              messageDiv.textContent = error.message || "Failed to remove participant.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error removing participant:", error);
            }
          });

          listItem.appendChild(participantName);
          listItem.appendChild(removeButton);
          participantsList.appendChild(listItem);
        });
      } else {
        const emptyState = document.createElement("li");
        emptyState.className = "participants-empty";
        emptyState.textContent = "No participants yet.";
        participantsList.appendChild(emptyState);
      }

      participantsSection.appendChild(participantsList);
      activityCard.appendChild(participantsSection);

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", {
        cache: "no-store",
      });
      const activities = await response.json();

      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

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
