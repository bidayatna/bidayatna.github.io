document.addEventListener("DOMContentLoaded", () => {

    // --- State Variable ---
    let currentOpenModalId = null; // Tracks the ID of the currently open modal

    // --- Get Common Elements ---
    const modalOverlay = document.getElementById("modal-overlay");
    const hamburgerMenu = document.querySelector(".top-right-buttons"); // The menu container itself
    const menuToggleBtn = document.querySelector(".menu-toggle"); // The button to open/close the menu
    const bodyElement = document.body;
    const submitBtn = document.getElementById("submit-btn"); // Strategy button
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
        if (currentOpenModalId === modalId) {
             if (!modalOverlay.classList.contains("is-visible")) {
                 showOverlay();
             }
             return;
        }
        if (hamburgerMenu && hamburgerMenu.classList.contains("show")) {
             hamburgerMenu.classList.remove("show");
        }
        closeAllModalsAndMenus(true);
        bodyElement.appendChild(modalElement);
        showOverlay();
        modalElement.classList.add("is-open");
        modalElement.setAttribute("aria-hidden", "false");
        currentOpenModalId = modalId;
        const closeButton = modalElement.querySelector(".modal-close");
        if (closeButton) {
            closeButton.onclick = (e) => {
                e.stopPropagation();
                closeModal(modalElement);
            };
        }
        const focusTarget = modalElement.querySelector(".modal-content") || modalElement.querySelector(".modal-close");
        focusTarget?.focus();
    };

    const closeModal = (modalElement) => {
        if (!modalElement || !modalElement.classList.contains("is-open")) {
            return;
        }
        const modalId = modalElement.getAttribute("data-modal");
        modalElement.classList.remove("is-open");
        modalElement.setAttribute("aria-hidden", "true");
        if (currentOpenModalId === modalId) {
             currentOpenModalId = null;
        }
        setTimeout(() => {
            if (!document.querySelector(".modal.is-open")) {
                 hideOverlay();
            }
        }, 0);
    };

    // --- Close All Function ---
    const closeAllModalsAndMenus = (keepOverlay = false) => {
        let anyModalClosed = false;
        document.querySelectorAll(".modal.is-open").forEach(modal => {
             modal.classList.remove("is-open");
             modal.setAttribute("aria-hidden", "true");
             anyModalClosed = true;
        });
        if (anyModalClosed) {
            currentOpenModalId = null;
        }
        if (hamburgerMenu && hamburgerMenu.classList.contains("show")) {
            hamburgerMenu.classList.remove("show");
        }
        if (!keepOverlay && anyModalClosed) {
            hideOverlay();
        }
    };

    // --- Direct Event Listeners for Modal Triggers --- 
    document.querySelectorAll("[data-modal-trigger]").forEach(trigger => {
        trigger.addEventListener("click", (event) => {
            event.stopPropagation();
            const modalId = trigger.getAttribute("data-modal-trigger");
            if (modalId) {
                openModal(modalId);
            } else {
                console.error("Trigger button missing data-modal-trigger attribute:", trigger);
            }
        });
    });

    // --- Event Delegation for Close Buttons and Menu ---
    document.addEventListener("click", (event) => {
        const target = event.target;
        if (hamburgerMenu && hamburgerMenu.classList.contains("show") && !hamburgerMenu.contains(target) && !menuToggleBtn.contains(target)) {
            hamburgerMenu.classList.remove("show");
        }
    });

    // Prevent clicks inside modal content from bubbling up
    document.querySelectorAll(".modal-content").forEach(content => {
        content.addEventListener("click", e => {
            e.stopPropagation(); 
        });
    });

    // --- Hamburger Menu Toggle ---
    if (menuToggleBtn && hamburgerMenu) {
        menuToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isMenuOpening = !hamburgerMenu.classList.contains("show");
            if (isMenuOpening) {
                closeAllModalsAndMenus(false);
                const buttonRect = menuToggleBtn.getBoundingClientRect();
                const panelTop = buttonRect.bottom + 8;
                hamburgerMenu.style.top = `${panelTop}px`;
            }
            hamburgerMenu.classList.toggle("show");
        });
        hamburgerMenu.addEventListener("click", e => e.stopPropagation());
    }

    // --- Dark Mode Toggle Logic ---
    if (toggleButtons.length > 0) {
        const updateAllToggleIcons = (isDarkMode) => {
            toggleButtons.forEach(button => {
                const moonIcon = button.querySelector(".moon-icon");
                const sunIcon = button.querySelector(".sun-icon");
                if (moonIcon) moonIcon.style.display = isDarkMode ? "none" : "inline-flex";
                if (sunIcon) sunIcon.style.display = isDarkMode ? "inline-flex" : "none";
            });
        };
        let isDarkMode = bodyElement.classList.contains("dark-mode"); 
        updateAllToggleIcons(isDarkMode);
        toggleButtons.forEach(button => {
            button.addEventListener("click", () => {
                isDarkMode = !isDarkMode;
                bodyElement.classList.toggle("dark-mode", isDarkMode);
                updateAllToggleIcons(isDarkMode);
            });
        });
    }

    // --- Placeholder Hiding Logic ---
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

    // --- Age Range Other Field Logic ---
    const ageRangeSelect = document.getElementById("age-range");
    const ageRangeOtherInput = document.getElementById("age-range-other");
    if (ageRangeSelect && ageRangeOtherInput) {
        const checkAgeRange = () => {
             ageRangeOtherInput.style.display = (ageRangeSelect.value === "other") ? "block" : "none";
             if (ageRangeSelect.value !== "other") ageRangeOtherInput.value = "";
        };
        ageRangeSelect.addEventListener("change", checkAgeRange);
        checkAgeRange();
    }

    // --- MODIFIED Together.ai API Integration Function (Uses Serverless Proxy) ---
    async function generateAIStrategy(promptText) {
        // IMPORTANT: Replace with the actual URL of YOUR deployed serverless function
        const proxyApiUrl = "/.netlify/functions/together-ai-proxy"; // Example for Netlify
        // const proxyApiUrl = "/api/together-ai-proxy"; // Example for Vercel

        const loadingElement = document.createElement("div");
        loadingElement.className = "loading-indicator";
        loadingElement.innerHTML = "<p>Generating your personalized marketing strategy...</p><div class=\"spinner\"></div>";
        document.body.appendChild(loadingElement);

        try {
            const response = await fetch(proxyApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: promptText }), // Send prompt in the request body
            });

            if (document.body.contains(loadingElement)) {
                document.body.removeChild(loadingElement);
            }

            if (!response.ok) {
                const errorData = await response.json(); // Attempt to parse error response
                console.error("Proxy API Error:", response.status, errorData);
                throw new Error(`Proxy API request failed with status ${response.status}: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices.length > 0 && data.choices[0].text) {
                return data.choices[0].text.trim();
            } else {
                console.error("Invalid response structure from proxy:", data);
                return "No valid response from AI.";
            }

        } catch (error) {
            console.error("Error calling serverless function:", error);
            if (document.body.contains(loadingElement)) {
                document.body.removeChild(loadingElement);
            }
            alert("There was an error generating your strategy. Please check the console for details and try again later.");
            return null;
        }
    }

    // --- Strategy Generation Button Logic (Using MODIFIED Together.ai function) ---
    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            // Validation and Data Gathering (This part remains the same as original)
            const formData = {};
            let validationPassed = true;
            let firstErrorElement = null;
            const getValue = (id) => {
                const element = document.getElementById(id);
                return element && typeof element.value !== "undefined" ? element.value.trim() : null;
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
            document.querySelectorAll(".input-field[style*=\"border-color: red\"]").forEach(el => el.style.borderColor = "");

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
            formData.socialOtherDescription = getValue("social-other-description");
            formData.languages = getValue("languages");
            formData.primaryGoals = getCheckedValues("goals");
            formData.goalsOtherDescription = getValue("goals-other-description");
            formData.goalsTimeframe = getValue("goals-timeframe");
            formData.goalsRoi = validateNumber("goals-roi", "Expected ROI / Revenue Goal (SAR)");
            formData.strategyStatus = getValue("strategy-status");
            formData.currentStrategyDescription = getValue("current-strategy-description");
            formData.marketingBudgetAmount = validateNumber("marketing-budget-amount", "Marketing Budget Amount (SAR)");
            formData.marketingBudgetPeriod = getValue("marketing-budget-period");
            formData.marketingBudgetPeriodOther = getValue("marketing-budget-period-other");
            formData.marketingSource = getRadioValue("marketing_source");
            formData.marketingIdeas = getValue("marketing-ideas");
            formData.brandVoice = getValue("brand-voice");
            formData.contentTypes = getValue("content-types");
            formData.competitors = getValue("competitors");

            if (!formData.strategyStatus) {
                alert("Please select whether you have an existing marketing strategy.");
                const element = document.getElementById("strategy-status");
                element.style.borderColor = "red";
                validationPassed = false;
                if (!firstErrorElement) firstErrorElement = element;
            }
            else if (formData.strategyStatus === "yes" && !formData.currentStrategyDescription) {
                alert("Please describe your current strategy since you selected \"Yes\".");
                const element = document.getElementById("current-strategy-description");
                element.style.borderColor = "red";
                validationPassed = false;
                if (!firstErrorElement) firstErrorElement = element;
            }

            if (formData.marketingBudgetAmount !== null && !formData.marketingBudgetPeriod) {
                alert("Please select a budget period (Monthly, Yearly, Total, Other) since you provided a budget amount.");
                const element = document.getElementById("marketing-budget-period");
                element.style.borderColor = "red";
                validationPassed = false;
                if (!firstErrorElement) firstErrorElement = element;
            }

            if (!validationPassed) {
                if(firstErrorElement) firstErrorElement.focus();
                return;
            }

            // Constructing the prompt (This part remains the same as original)
            let prompt = "Generate a comprehensive marketing strategy based on the following business details:\n";
            const addLine = (label, value, emptyText = "[User wants AI to determine/suggest]") => {
                const notProvidedExceptions = [
                    "Website", "Current Users/Customers", "Target Locations / Countries",
                    "Languages Spoken", "Primary Goals"
                ];
                const isEmpty = (value === null || value === "" || value === undefined || (Array.isArray(value) && value.length === 0));
                if (isEmpty && notProvidedExceptions.includes(label)) emptyText = "[Not Provided]";
                if (label === "Timeframe for Goals" && (!formData.primaryGoals || formData.primaryGoals.length === 0)) emptyText = "[Not Provided]";

                if (!isEmpty) {
                    prompt += `- ${label}: ${Array.isArray(value) ? value.join(", ") : value}\n`;
                } else {
                    prompt += `- ${label}: ${emptyText}\n`;
                }
            };

            addLine("Brand/Company Name", formData.brandName);
            addLine("Business Description", formData.businessDescription);
            addLine("Website", formData.website);
            addLine("Industry/Niche", formData.industryNiche);
            addLine("Current Users/Customers", formData.currentUsers);
            addLine("Targeted Users/Growth Goal", formData.targetUsers);
            let ageDisplay = formData.ageRange;
            if (formData.ageRange === "other" && formData.ageRangeOther) ageDisplay = formData.ageRangeOther;
            addLine("User Age Range", ageDisplay);
            addLine("Target Locations / Countries", formData.locations);
            let socialDisplay = formData.socialPlatforms;
            if (socialDisplay.includes("other") && formData.socialOtherDescription) {
                socialDisplay = socialDisplay.filter(p => p !== "other").concat(formData.socialOtherDescription);
            }
            addLine("Main Social Media Platforms", socialDisplay);
            addLine("Languages Spoken by Audience", formData.languages);
            let goalsDisplay = formData.primaryGoals;
            if (goalsDisplay.includes("other") && formData.goalsOtherDescription) {
                goalsDisplay = goalsDisplay.filter(g => g !== "other").concat(formData.goalsOtherDescription);
            }
            addLine("Primary Marketing Goals", goalsDisplay);
            addLine("Timeframe for Goals", formData.goalsTimeframe);
            addLine("Expected ROI or Revenue Goal (SAR)", formData.goalsRoi);
            addLine("Existing Marketing Strategy Status", formData.strategyStatus);
            if (formData.strategyStatus === "yes" || formData.strategyStatus === "rough") {
                addLine("Current Strategy Description", formData.currentStrategyDescription);
            }
            let budgetDisplay = formData.marketingBudgetAmount;
            if (budgetDisplay !== null && formData.marketingBudgetPeriod) {
                let period = formData.marketingBudgetPeriod;
                if (period === "other" && formData.marketingBudgetPeriodOther) period = formData.marketingBudgetPeriodOther;
                budgetDisplay = `${budgetDisplay} SAR (${period})`;
            }
            addLine("Marketing Budget", budgetDisplay);
            addLine("Marketing Source (In-house/Agency/Freelancer/None)", formData.marketingSource);
            addLine("Marketing Ideas to Explore", formData.marketingIdeas);
            addLine("Brand Voice/Tone", formData.brandVoice);
            addLine("Preferred Content Types", formData.contentTypes);
            addLine("Competitors to Admire/Outperform", formData.competitors);

            prompt += "\nPlease provide a detailed, actionable marketing strategy. Include sections for: Executive Summary, Target Audience Deep Dive, Key Marketing Objectives (SMART), Core Messaging & Positioning, Recommended Marketing Channels & Tactics (with rationale), Content Strategy Outline, Budget Allocation Suggestions (if budget provided, otherwise general guidance), KPIs & Measurement Plan, and a Timeline/Roadmap. The strategy should be professional, insightful, and tailored to the provided information.";

            console.log("Generated Prompt for AI:", prompt);

            // Call the MODIFIED function to get the AI strategy via proxy
            const aiStrategy = await generateAIStrategy(prompt);

            if (aiStrategy) {
                // Display the strategy (e.g., in a modal or a new section)
                // For now, let's just alert it or log it
                console.log("AI Generated Strategy:", aiStrategy);
                // You would replace this with your actual display logic
                // For example, creating a new modal or div to show the strategy:
                const strategyModalContent = document.createElement("div");
                strategyModalContent.style.whiteSpace = "pre-wrap"; // Preserve formatting
                strategyModalContent.textContent = aiStrategy;
                
                // Example: Open a new modal to display the strategy
                // This assumes you have a generic modal structure or can create one
                const resultModal = document.createElement("div");
                resultModal.className = "modal is-open"; // Add classes to make it visible
                resultModal.setAttribute("data-modal", "strategy-result-modal");
                resultModal.setAttribute("aria-hidden", "false");
                const resultContent = document.createElement("div");
                resultContent.className = "modal-content";
                const closeBtn = document.createElement("span");
                closeBtn.className = "close modal-close";
                closeBtn.innerHTML = "&times;";
                closeBtn.onclick = () => {
                    closeModal(resultModal);
                    // Optional: remove the modal from DOM after closing if it was dynamically added
                    if (document.body.contains(resultModal)) {
                        document.body.removeChild(resultModal);
                    }
                };
                const title = document.createElement("h2");
                title.textContent = "Your AI-Generated Marketing Strategy";
                resultContent.appendChild(closeBtn);
                resultContent.appendChild(title);
                resultContent.appendChild(strategyModalContent);
                resultModal.appendChild(resultContent);
                document.body.appendChild(resultModal);
                showOverlay(); // Show overlay if not already visible
                openModal("strategy-result-modal"); // This might be redundant if classes are set correctly
            } else {
                // Error already handled in generateAIStrategy
                console.log("Strategy generation failed or returned null.");
            }
        });
    }

    // --- Survey Form Logic ---
    if (surveyForm) {
        surveyForm.addEventListener("submit", function(event) {
            let missingRequired = false;
            const requiredGroups = surveyForm.querySelectorAll("[data-required=\"true\"]");
            
            requiredGroups.forEach(group => {
                const inputs = group.querySelectorAll("input[type=\"radio\"], input[type=\"checkbox\"]");
                let isChecked = false;
                inputs.forEach(input => {
                    if (input.checked) isChecked = true;
                });
                if (!isChecked) {
                    missingRequired = true;
                    const msg = group.dataset.requiredMsg || "This field is required.";
                    alert(msg);
                    // Optionally, focus the first input of the group or highlight the group
                    if (inputs.length > 0) inputs[0].focus();
                }
            });

            if (missingRequired) {
                event.preventDefault(); // Stop form submission
            }
            // If submission proceeds, it will go to FormSubmit.co as configured in HTML
        });
    }

    // --- Conditional Display for "Other" Input Fields ---
    function setupConditionalInput(selectId, otherInputId) {
        const selectElement = document.getElementById(selectId);
        const otherInputElement = document.getElementById(otherInputId);

        if (selectElement && otherInputElement) {
            const checkOther = () => {
                otherInputElement.style.display = (selectElement.value === "other") ? "block" : "none";
                if (selectElement.value !== "other") {
                    otherInputElement.value = ""; // Clear if not "other"
                }
            };
            selectElement.addEventListener("change", checkOther);
            checkOther(); // Initial check on page load
        }
    }

    setupConditionalInput("social-platforms-select", "social-other-description"); // Assuming you change checkbox to select or adapt logic
    setupConditionalInput("marketing-goals-select", "goals-other-description"); // Assuming you change checkbox to select or adapt logic
    setupConditionalInput("marketing-budget-period", "marketing-budget-period-other");
    // Note: The original HTML uses checkboxes for social platforms and goals.
    // The setupConditionalInput is designed for select elements.
    // You'll need to adjust your HTML or this JS if you keep checkboxes for those.
    // For checkboxes, you might check if the 'other' checkbox is checked.

    // Example for checkbox-based "Other" field (Social Media):
    const socialOtherCheckbox = document.querySelector("input[name=\"social\"][value=\"other\"]");
    const socialOtherDescriptionInput = document.getElementById("social-other-description");
    if (socialOtherCheckbox && socialOtherDescriptionInput) {
        const checkSocialOther = () => {
            socialOtherDescriptionInput.style.display = socialOtherCheckbox.checked ? "block" : "none";
            if (!socialOtherCheckbox.checked) socialOtherDescriptionInput.value = "";
        };
        socialOtherCheckbox.addEventListener("change", checkSocialOther);
        checkSocialOther(); // Initial check
    }

    // Example for checkbox-based "Other" field (Marketing Goals):
    const goalsOtherCheckbox = document.querySelector("input[name=\"goals\"][value=\"other\"]");
    const goalsOtherDescriptionInput = document.getElementById("goals-other-description");
    if (goalsOtherCheckbox && goalsOtherDescriptionInput) {
        const checkGoalsOther = () => {
            goalsOtherDescriptionInput.style.display = goalsOtherCheckbox.checked ? "block" : "none";
            if (!goalsOtherCheckbox.checked) goalsOtherDescriptionInput.value = "";
        };
        goalsOtherCheckbox.addEventListener("change", checkGoalsOther);
        checkGoalsOther(); // Initial check
    }
    
    // --- Cookie Consent Banner Logic ---
    const cookieBanner = document.getElementById("cookie-consent-banner");
    const acceptCookiesBtn = document.getElementById("accept-cookies-btn");
    const privacyLinkFromCookie = document.querySelector("[data-modal-trigger=\"privacy-modal-from-cookie\"]");

    // Check if consent was already given
    if (localStorage.getItem("cookieConsent") !== "accepted") {
        if (cookieBanner) cookieBanner.style.display = "block";
    }

    if (acceptCookiesBtn) {
        acceptCookiesBtn.addEventListener("click", () => {
            localStorage.setItem("cookieConsent", "accepted");
            if (cookieBanner) cookieBanner.style.display = "none";
        });
    }
    
    // Ensure the privacy modal can be triggered from the cookie banner link
    if (privacyLinkFromCookie) {
        privacyLinkFromCookie.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent default link behavior
            event.stopPropagation();
            openModal("privacy-modal"); // Open the privacy modal
        });
    }

});
