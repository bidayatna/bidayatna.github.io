document.addEventListener("DOMContentLoaded", () => {

    // --- State Variable ---
    let currentOpenModalId = null; // Tracks the ID of the currently open modal

    // --- Get Common Elements ---
    const modalOverlay = document.getElementById("modal-overlay");
    const hamburgerMenu = document.querySelector(".top-right-buttons"); // The menu container itself
    const menuToggleBtn = document.querySelector(".menu-toggle"); // The button to open/close the menu
    const bodyElement = document.body;
    const submitBtn = document.getElementById("submit-btn"); // Strategy button
    // Get BOTH dark mode toggle buttons
    const toggleButtons = document.querySelectorAll(".dark-mode-toggle"); // Use common class
    const surveyForm = document.getElementById("user-survey-form");

    // --- Overlay Functions (Class-based) ---
    const showOverlay = () => {
        if (modalOverlay) {
            modalOverlay.classList.add("is-visible");
        }
    };
    const hideOverlay = () => {
        if (modalOverlay) {
            modalOverlay.classList.remove("is-visible");
        }
    };

    // --- Unified Modal Open/Close Functions (Class-based) ---
    const openModal = (modalId) => {
        const modalElement = document.querySelector(`[data-modal="${modalId}"]`);
        if (!modalElement) {
            console.error(`Modal element not found for ID: ${modalId}`);
            return;
        }
        // Don't reopen if already open, but ensure overlay is shown if somehow hidden
        if (currentOpenModalId === modalId) {
             if (!modalOverlay.classList.contains("is-visible")) {
                 showOverlay(); // Ensure overlay consistency if re-triggering same modal
             }
             return;
        }

        // Close hamburger menu if open, but keep overlay if switching modals
        if (hamburgerMenu && hamburgerMenu.classList.contains("show")) {
             hamburgerMenu.classList.remove("show");
        }
        // Close other modals, keep overlay if switching between modals
        closeAllModalsAndMenus(true);

        // Move modal to end of body to ensure it's on top
        bodyElement.appendChild(modalElement);

        showOverlay(); // Ensure overlay is visible for the new modal
        modalElement.classList.add("is-open");
        modalElement.setAttribute("aria-hidden", "false");
        currentOpenModalId = modalId; // Update state

        // Attach dedicated close listener
        const closeButton = modalElement.querySelector(".modal-close");
        if (closeButton) {
            // Remove any existing listener first to prevent duplicates (optional but safe)
            // Note: This requires storing the listener function if we want to remove it reliably.
            // Simpler approach for now: rely on the fact that openModal doesn't re-run fully if already open.
            closeButton.onclick = (e) => { // Use onclick for simplicity here
                e.stopPropagation();
                closeModal(modalElement);
            };
        }

        // Focus on the modal content or close button for accessibility
        const focusTarget = modalElement.querySelector(".modal-content") || modalElement.querySelector(".modal-close");
        focusTarget?.focus();
    };

    const closeModal = (modalElement) => {
        if (!modalElement || !modalElement.classList.contains("is-open")) {
            return; // Only close if it's actually open
        }
        const modalId = modalElement.getAttribute("data-modal");
        modalElement.classList.remove("is-open");
        modalElement.setAttribute("aria-hidden", "true");

        if (currentOpenModalId === modalId) {
             currentOpenModalId = null; // Update state only if closing the current one
        }

        // Only hide overlay if no other modal is open after this one closes
        // Use setTimeout to allow potential rapid opening of another modal
        setTimeout(() => {
            if (!document.querySelector(".modal.is-open")) {
                 hideOverlay();
            }
        }, 0); // Slight delay to check state after potential immediate re-open
    };

    // --- Close All Function (Closes modals, menu, and potentially overlay) ---
    // Modified: Hamburger menu closing is separate, overlay tied only to modals.
    const closeAllModalsAndMenus = (keepOverlay = false) => {
        let anyModalClosed = false;
        document.querySelectorAll(".modal.is-open").forEach(modal => {
             modal.classList.remove("is-open");
             modal.setAttribute("aria-hidden", "true");
             anyModalClosed = true;
        });

        if (anyModalClosed) {
            currentOpenModalId = null; // Reset modal state if any modal was closed
        }

        // Close Hamburger Menu if it's open
        if (hamburgerMenu && hamburgerMenu.classList.contains("show")) {
            hamburgerMenu.classList.remove("show");
        }

        // Only hide overlay if explicitly told not to keep it AND if a modal was actually closed
        if (!keepOverlay && anyModalClosed) {
            hideOverlay();
        }
    };

    // --- Direct Event Listeners for Modal Triggers --- 
    document.querySelectorAll("[data-modal-trigger]").forEach(trigger => {
        trigger.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent potential conflicts
            const modalId = trigger.getAttribute("data-modal-trigger");
            if (modalId) {
                openModal(modalId);
            } else {
                console.error("Trigger button missing data-modal-trigger attribute:", trigger);
            }
        });
    });

    // --- Event Delegation for Close Buttons and Menu ---
    // Modified: Removed overlay click handling
    document.addEventListener("click", (event) => {
        const target = event.target;
        const openModalElement = currentOpenModalId ? document.querySelector(`[data-modal="${currentOpenModalId}"]`) : null;

        // --- Hamburger Menu Close (Clicking outside) ---
        // Check if menu is open AND click is outside the menu AND outside the toggle button
        if (hamburgerMenu && hamburgerMenu.classList.contains("show") && !hamburgerMenu.contains(target) && !menuToggleBtn.contains(target)) {
            hamburgerMenu.classList.remove("show");
            // Closing menu by clicking outside doesn't affect overlay
        }
    });

    // Prevent clicks inside modal content from bubbling up (Keep as safeguard)
    document.querySelectorAll(".modal-content").forEach(content => {
        content.addEventListener("click", e => {
            e.stopPropagation(); 
        });
    });

    // --- Hamburger Menu Toggle (Separate Logic) ---
    // Modified: Close modals *before* opening menu & dynamically position panel.
    if (menuToggleBtn && hamburgerMenu) {
        menuToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isMenuOpening = !hamburgerMenu.classList.contains("show");

            if (isMenuOpening) {
                // If opening the menu, ensure any open modals (and the overlay) are closed first.
                closeAllModalsAndMenus(false); // Pass false to ensure overlay hides if modals close.

                // Dynamically set the top position relative to the toggle button
                const buttonRect = menuToggleBtn.getBoundingClientRect();
                const panelTop = buttonRect.bottom + 8; // 8px gap below the button
                hamburgerMenu.style.top = `${panelTop}px`;
            }
            
            // Toggle the menu visibility
            hamburgerMenu.classList.toggle("show");

            // If the menu was just closed by the toggle button, it doesn't affect modals/overlay.
        });
        // Prevent clicks inside the hamburger menu itself from closing it via the document listener
        hamburgerMenu.addEventListener("click", e => e.stopPropagation());
    }


    // --- Dark Mode Toggle Logic --- (UPDATED for multiple buttons)
    if (toggleButtons.length > 0) {
        // Function to update icons on ALL toggle buttons
        const updateAllToggleIcons = (isDarkMode) => {
            toggleButtons.forEach(button => {
                const moonIcon = button.querySelector(".moon-icon");
                const sunIcon = button.querySelector(".sun-icon");
                if (moonIcon) moonIcon.style.display = isDarkMode ? "none" : "inline-flex";
                if (sunIcon) sunIcon.style.display = isDarkMode ? "inline-flex" : "none";
            });
        };

        // Initial state check
        let isDarkMode = bodyElement.classList.contains("dark-mode"); 
        updateAllToggleIcons(isDarkMode);

        // Add event listener to each button
        toggleButtons.forEach(button => {
            button.addEventListener("click", () => {
                isDarkMode = !isDarkMode; // Toggle the state
                bodyElement.classList.toggle("dark-mode", isDarkMode); // Apply class to body
                updateAllToggleIcons(isDarkMode); // Update icons on all buttons
            });
        });
    }

    // --- Placeholder Hiding Logic --- (Keep unchanged)
    const inputFields = document.querySelectorAll(".input-field");
    inputFields.forEach((field) => {
        if (!field.dataset) field.dataset = {};
        field.dataset.originalPlaceholder = field.placeholder;
        field.addEventListener("focus", () => { field.placeholder = ""; });
        field.addEventListener("blur", () => {
            if (field.value === "") { field.placeholder = field.dataset.originalPlaceholder; }
        });
        if (field.value !== "") { field.placeholder = ""; }
    });

    // --- Age Range Other Field Logic --- (Keep unchanged)
    const ageRangeSelect = document.getElementById("age-range");
    const ageRangeOtherInput = document.getElementById("age-range-other");
    if (ageRangeSelect && ageRangeOtherInput) {
        const checkAgeRange = () => {
             ageRangeOtherInput.style.display = (ageRangeSelect.value === "other") ? "block" : "none";
             if (ageRangeSelect.value !== "other") ageRangeOtherInput.value = "";
        };
        ageRangeSelect.addEventListener("change", checkAgeRange);
        checkAgeRange(); // Initial check
    }

    // --- Generate Strategy Button Logic --- (Keep unchanged)
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            // ... (rest of the strategy generation logic remains unchanged) ...
             const formData = {};
            let validationPassed = true;
            let firstErrorElement = null;
            const getValue = (id) => {
                const element = document.getElementById(id);
                return element && typeof element.value !== 'undefined' ? element.value.trim() : null;
            };
            const getCheckedValues = (name) => {
                const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
                return checkboxes ? Array.from(checkboxes).map((cb) => cb.value) : [];
            };
            const getRadioValue = (name) => {
                const radio = document.querySelector(`input[name="${name}"]:checked`);
                return radio ? radio.value : null;
            };
            const validateNumber = (id, fieldName) => {
                const element = document.getElementById(id);
                if (!element) return null;
                const value = element.value.trim();
                if (value === "") return null;
                const number = Number(value);
                if (isNaN(number) || number < 0) {
                    alert(`Invalid input for ${fieldName}. Please enter a non-negative number.`);
                    element.style.borderColor = "red";
                    validationPassed = false;
                    if (!firstErrorElement) firstErrorElement = element;
                    return null;
                } else {
                    element.style.borderColor = "";
                    return number;
                }
            };
            document.querySelectorAll(".input-field[style*='border-color: red']").forEach(el => el.style.borderColor = "");

            formData.brandName = getValue("brand-name");
            formData.businessDescription = getValue("business-description");
            formData.website = getValue("website");
            formData.industryNiche = getValue("industry-niche");
            formData.currentUsers = validateNumber("current-users", "Current Users");
            formData.targetUsers = getValue("target-users");
            formData.ageRange = getValue("age-range");
            if (formData.ageRange === "other") formData.ageRangeOther = getValue("age-range-other");
            formData.locations = getValue("locations");
            formData.socialPlatforms = getCheckedValues("social");
            formData.languages = getValue("languages");
            formData.primaryGoals = getCheckedValues("goals");
            formData.goalsTimeframe = getValue("goals-timeframe");
            formData.goalsRoi = getValue("goals-roi");
            formData.strategyStatus = getValue("strategy-status");
            formData.currentStrategyDescription = getValue("current-strategy-description");
            formData.marketingBudget = validateNumber("marketing-budget", "Marketing Budget");
            formData.marketingSource = getRadioValue("marketing_source");
            formData.marketingIdeas = getValue("marketing-ideas");
            formData.brandVoice = getValue("brand-voice");
            formData.contentTypes = getValue("content-types");
            formData.competitors = getValue("competitors");
            if (!validationPassed) {
                if(firstErrorElement) firstErrorElement.focus();
                return;
            }
            let prompt = "Generate a comprehensive marketing strategy based on the following user inputs. If a field is marked as '[User wants AI to determine/suggest]' or '[Not Provided]', use your best judgment to fill in the gaps or make recommendations based on the provided context.\n\n";
             const addLine = (label, value, emptyText = "[User wants AI to determine/suggest]") => {
                if (value !== null && value !== "" && value !== undefined && (!Array.isArray(value) || value.length > 0)) {
                    prompt += `- ${label}: ${Array.isArray(value) ? value.join(", ") : value}\n`;
                } else {
                    prompt += `- ${label}: ${emptyText}\n`;
                }
            };
            prompt += "**Business Identity:**\n";
            addLine("Brand / Company Name", formData.brandName, "[Not Provided]");
            addLine("Brief Description", formData.businessDescription, "[Not Provided]");
            addLine("Website", formData.website, "[Not Provided]");
            addLine("Industry / Niche", formData.industryNiche, "[Not Provided]");
            prompt += "\n**Target Audience:**\n";
            addLine("Current Users/Customers", formData.currentUsers, "[Not Provided]");
            addLine("Target Users / Growth Goal", formData.targetUsers, "[User wants AI to determine/suggest]");
            let ageRangeDisplay = formData.ageRange;
            if (formData.ageRange === "other" && formData.ageRangeOther) ageRangeDisplay = `Other (${formData.ageRangeOther})`;
            else if (formData.ageRange === "other") ageRangeDisplay = "Other (Not Specified)";
            addLine("User Age Range", ageRangeDisplay, "[Not Provided]");
            addLine("Target Locations / Countries", formData.locations, "[Not Provided]");
            addLine("Main Social Media Platforms", formData.socialPlatforms, "[Not Provided]");
            addLine("Languages Spoken", formData.languages, "[Not Provided]");
            prompt += "\n**Marketing Goals:**\n";
            addLine("Primary Goals", formData.primaryGoals, "[User wants AI to determine/suggest]");
            addLine("Timeframe for Goals", formData.goalsTimeframe, "[User wants AI to determine/suggest]");
            addLine("Expected ROI / Revenue Goal", formData.goalsRoi, "[User wants AI to determine/suggest]");
            prompt += "\n**Current Strategy & Resources:**\n";
            addLine("Existing Strategy Status", formData.strategyStatus, "[Not Provided]");
            addLine("Current Strategy Description", formData.currentStrategyDescription, "[Not Provided]");
            addLine("Marketing Budget (Monthly/Total)", formData.marketingBudget, "[User wants AI to determine/suggest]");
            addLine("Marketing Source (In-house/Outsourced)", formData.marketingSource, "[Not Provided]");
            prompt += "\n**Creative Ideas & Preferences:**\n";
            addLine("Marketing Ideas to Explore", formData.marketingIdeas, "[User wants AI to determine/suggest]");
            addLine("Brand Voice or Tone", formData.brandVoice, "[Not Provided]");
            addLine("Preferred Content Types", formData.contentTypes, "[Not Provided]");
            addLine("Competitors", formData.competitors, "[Not Provided]");
            prompt += "\nGenerate the strategy.";
            console.log("Generated Prompt:", prompt);
            alert("Strategy generation initiated. This might take a moment.");
        });
    }

    // --- Survey Submission Logic --- (Keep unchanged)
    if (surveyForm) {
        const referralRadio = surveyForm.querySelectorAll('input[name="referral"]');
        const socialSpecifyDiv = document.getElementById('social-media-specify');
        const referralOtherInput = document.getElementById('referral-other-specify');

        referralRadio.forEach(radio => {
            radio.addEventListener('change', () => {
                if (socialSpecifyDiv) socialSpecifyDiv.style.display = (radio.value === 'social_media' && radio.checked) ? 'block' : 'none';
                if (referralOtherInput) referralOtherInput.style.display = (radio.value === 'other' && radio.checked) ? 'block' : 'none';
                if (radio.value !== 'social_media') {
                    surveyForm.querySelectorAll('input[name="social_platform"]:checked').forEach(cb => cb.checked = false);
                }
                if (radio.value !== 'other' && referralOtherInput) {
                    referralOtherInput.value = '';
                }
            });
        });

        surveyForm.addEventListener("submit", (event) => {
            event.preventDefault();
            let surveyValid = true;
            let firstSurveyErrorElement = null;

            // Clear previous errors
            surveyForm.querySelectorAll('.error-message').forEach(el => el.remove());
            surveyForm.querySelectorAll('[style*="border-color: red"]').forEach(el => el.style.borderColor = '');

            // Check required radio/checkbox groups
            surveyForm.querySelectorAll('[data-required="true"]').forEach(group => {
                const groupLabel = group.previousElementSibling?.textContent || 'This field';
                const requiredMsg = group.dataset.requiredMsg || `${groupLabel} is required.`;
                const inputs = group.querySelectorAll('input[type="radio"], input[type="checkbox"]');
                const isChecked = Array.from(inputs).some(input => input.checked);
                
                if (!isChecked) {
                    surveyValid = false;
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = requiredMsg;
                    group.appendChild(errorDiv);
                    if (!firstSurveyErrorElement) firstSurveyErrorElement = inputs[0];
                }
            });

            // Check required text inputs
            surveyForm.querySelectorAll('input[type="text"][required], textarea[required]').forEach(input => {
                if (!input.value.trim()) {
                    surveyValid = false;
                    const groupLabel = input.previousElementSibling?.textContent || 'This field';
                    const requiredMsg = input.dataset.requiredMsg || `${groupLabel} is required.`;
                    input.style.borderColor = 'red';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.style.marginLeft = '0'; // No indent for text field errors
                    errorDiv.textContent = requiredMsg;
                    input.parentNode.insertBefore(errorDiv, input.nextSibling);
                    if (!firstSurveyErrorElement) firstSurveyErrorElement = input;
                }
            });

            if (!surveyValid) {
                if (firstSurveyErrorElement) firstSurveyErrorElement.focus();
                alert("Please fill out all required survey fields.");
                return;
            }

            // If valid, proceed with submission (e.g., log to console or send data)
            const surveyData = new FormData(surveyForm);
            console.log("Survey Submitted:");
            for (let [key, value] of surveyData.entries()) {
                console.log(`${key}: ${value}`);
            }
            alert("Thank you for your feedback!");
            const surveyModalElement = document.getElementById("survey-modal");
            if (surveyModalElement) closeModal(surveyModalElement);
            surveyForm.reset(); // Optionally reset form
            // Reset conditional fields visibility
            if (socialSpecifyDiv) socialSpecifyDiv.style.display = 'none';
            if (referralOtherInput) referralOtherInput.style.display = 'none';
        });
    }

}); // End DOMContentLoaded


    // --- Cookie Consent Logic ---
    const cookieBanner = document.getElementById("cookie-consent-banner");
    const acceptCookiesBtn = document.getElementById("accept-cookies-btn");
    const privacyLinkInBanner = cookieBanner ? cookieBanner.querySelector("a[data-modal-trigger=\"privacy-modal-from-cookie\"]") : null;

    // Check if consent has already been given
    const consentGiven = localStorage.getItem("cookie_consent_given");

    if (cookieBanner && acceptCookiesBtn && !consentGiven) {
        cookieBanner.style.display = "flex"; // Show the banner if no consent stored

        acceptCookiesBtn.addEventListener("click", () => {
            cookieBanner.style.display = "none"; // Hide the banner
            localStorage.setItem("cookie_consent_given", "true"); // Store consent
        });

        // Make the privacy policy link in the banner trigger the main privacy modal
        if (privacyLinkInBanner) {
            privacyLinkInBanner.setAttribute("data-modal-trigger", "privacy-modal"); // Point to the correct modal
            privacyLinkInBanner.addEventListener("click", (event) => {
                event.preventDefault(); // Prevent default link behavior
                event.stopPropagation();
                openModal("privacy-modal");
            });
        }
    }