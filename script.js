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

    // --- Together.ai API Integration Function ---
    async function generateAIStrategy(prompt) {
        const API_KEY = "20f36cd0f3183d66819a4947544b83e190330eb159c73ceb968419324e5e648e";
        const API_URL = "https://api.together.xyz/v1/completions";
        const loadingElement = document.createElement("div");
        loadingElement.className = "loading-indicator";
        loadingElement.innerHTML = "<p>Generating your personalized marketing strategy...</p><div class=\"spinner\"></div>";
        
        try {
            document.body.appendChild(loadingElement);
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "togethercomputer/llama-3-70b-instruct",
                    prompt: prompt,
                    max_tokens: 3000,
                    temperature: 0.7,
                    top_p: 0.9,
                    stop: ["", "\n\n"]
                })
            });
            document.body.removeChild(loadingElement);
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            return data.choices[0].text;
        } catch (error) {
            console.error("Error generating strategy:", error);
            alert("There was an error generating your strategy. Please try again later.");
            const existingLoading = document.querySelector(".loading-indicator");
            if (existingLoading) document.body.removeChild(existingLoading);
            return null;
        }
    }

    // --- Strategy Generation Button Logic (Using Together.ai) ---
    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            // Validation and Data Gathering
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
            formData.socialOtherDescription = getValue("social-other-description"); // Added for 'other' social
            formData.languages = getValue("languages");
            formData.primaryGoals = getCheckedValues("goals");
            formData.goalsOtherDescription = getValue("goals-other-description"); // Added for 'other' goals
            formData.goalsTimeframe = getValue("goals-timeframe");
            formData.goalsRoi = validateNumber("goals-roi", "Expected ROI / Revenue Goal (SAR)");
            formData.strategyStatus = getValue("strategy-status");
            formData.currentStrategyDescription = getValue("current-strategy-description");
            formData.marketingBudgetAmount = validateNumber("marketing-budget-amount", "Marketing Budget Amount (SAR)");
            formData.marketingBudgetPeriod = getValue("marketing-budget-period");
            formData.marketingBudgetPeriodOther = getValue("marketing-budget-period-other"); // Added for 'other' budget period
            formData.marketingSource = getRadioValue("marketing_source");
            formData.marketingIdeas = getValue("marketing-ideas");
            formData.brandVoice = getValue("brand-voice");
            formData.contentTypes = getValue("content-types");
            formData.competitors = getValue("competitors");

            // --- Conditional Validation ---
            // Ensure strategy status is selected
            if (!formData.strategyStatus) {
                alert("Please select whether you have an existing marketing strategy.");
                const element = document.getElementById("strategy-status");
                element.style.borderColor = "red";
                validationPassed = false;
                if (!firstErrorElement) firstErrorElement = element;
            }
            // Require strategy description if status is 'yes'
            else if (formData.strategyStatus === "yes" && !formData.currentStrategyDescription) {
                alert("Please describe your current strategy since you selected \"Yes\".");
                const element = document.getElementById("current-strategy-description");
                element.style.borderColor = "red";
                validationPassed = false;
                if (!firstErrorElement) firstErrorElement = element;
            }

            // Require budget period if budget amount is given
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

            const addLine = (label, value, emptyText = "[User wants AI to determine/suggest]") => {
                // Specific exceptions where empty means Not Provided, not AI suggestion
                const notProvidedExceptions = [
                    "Website",
                    "Current Users/Customers",
                    "Target Locations / Countries",
                    "Languages Spoken",
                    "Primary Goals"
                    // Timeframe is handled conditionally below
                ];
                
                const isEmpty = (value === null || value === "" || value === undefined || (Array.isArray(value) && value.length === 0));
                
                if (isEmpty && notProvidedExceptions.includes(label)) {
                    emptyText = "[Not Provided]";
                }
                
                // Conditional logic for Timeframe
                if (label === "Timeframe for Goals" && (!formData.primaryGoals || formData.primaryGoals.length === 0)) {
                    emptyText = "[Not Provided]";
                }

                if (!isEmpty) {
                    prompt += `- ${label}: ${Array.isArray(value) ? value.join(", ") : value}\n`;
                } else {
                    prompt += `- ${label}: ${emptyText}\n`;
                }
            };
            prompt += "**Business Identity:**\n";
            addLine("Brand / Company Name", formData.brandName);
            addLine("Brief Description", formData.businessDescription);
            addLine("Website", formData.website); // Exception handled by addLine
            addLine("Industry / Niche", formData.industryNiche);
            prompt += "\n**Target Audience:**\n";
            addLine("Current Users/Customers", formData.currentUsers); // Exception handled by addLine
            addLine("Target Users / Growth Goal", formData.targetUsers);
            let ageRangeDisplay = formData.ageRange;
            if (formData.ageRange === "other" && formData.ageRangeOther) ageRangeDisplay = `Other (${formData.ageRangeOther})`;
            else if (formData.ageRange === "other") ageRangeDisplay = "Other (Not Specified)";
            addLine("User Age Range", ageRangeDisplay);
            addLine("Target Locations / Countries", formData.locations); // Exception handled by addLine
            // Prepare social platforms display string
            let socialDisplay = formData.socialPlatforms;
            if (Array.isArray(socialDisplay) && socialDisplay.includes("other")) {
                const otherPlatforms = socialDisplay.filter(p => p !== "other").join(", ");
                let otherDescription = formData.socialOtherDescription ? ` (${formData.socialOtherDescription})` : " (Not Specified)";
                if (otherPlatforms) {
                    socialDisplay = `${otherPlatforms}, Other${otherDescription}`;
                } else {
                    socialDisplay = `Other${otherDescription}`;
                }
            }
            addLine("Main Social Media Platforms", socialDisplay);
            addLine("Languages Spoken", formData.languages); // Exception handled by addLine
            prompt += "\n**Marketing Goals:**\n";
            // Prepare goals display string
            let goalsDisplay = formData.primaryGoals;
            if (Array.isArray(goalsDisplay) && goalsDisplay.includes("other")) {
                // Filter out 'other' and join remaining goals
                const otherGoals = goalsDisplay.filter(g => g !== "other").join(", ");
                let otherDescription = formData.goalsOtherDescription ? ` (${formData.goalsOtherDescription})` : " (Not Specified)";
                // Construct the final string
                if (otherGoals) {
                    goalsDisplay = `${otherGoals}, Other${otherDescription}`;
                } else {
                    goalsDisplay = `Other${otherDescription}`;
                }
            }
            addLine("Primary Goals", goalsDisplay); // Use the constructed display string, exception handled by addLine
            addLine("Timeframe for Goals", formData.goalsTimeframe); // Conditional logic handled by addLine
            addLine("Expected ROI / Revenue Goal (SAR)", formData.goalsRoi);
            prompt += "\n**Current Strategy & Resources:**\n";
            addLine("Existing Strategy Status", formData.strategyStatus);
            addLine("Current Strategy Description", formData.currentStrategyDescription);
            let budgetString = "[User wants AI to determine/suggest]";
            if (formData.marketingBudgetAmount !== null) {
                budgetString = `${formData.marketingBudgetAmount} SAR`;
                let periodDisplay = formData.marketingBudgetPeriod;
                if (periodDisplay) {
                    if (periodDisplay === "other" && formData.marketingBudgetPeriodOther) {
                        periodDisplay = `Other (${formData.marketingBudgetPeriodOther})`;
                    } else if (periodDisplay === "other") {
                        periodDisplay = "Other (Not Specified)";
                    }
                    budgetString += ` (${periodDisplay})`;
                } else {
                    // This case is prevented by validation, but included for robustness
                    budgetString += ` (Period not specified)`; 
                }
            } else if (formData.marketingBudgetPeriod) {
                 // This case might occur if user only selects period
                 let periodDisplay = formData.marketingBudgetPeriod;
                 if (periodDisplay === "other" && formData.marketingBudgetPeriodOther) {
                     periodDisplay = `Other (${formData.marketingBudgetPeriodOther})`;
                 } else if (periodDisplay === "other") {
                     periodDisplay = "Other (Not Specified)";
                 }
                 budgetString = `Budget period specified as ${periodDisplay}, but amount not provided.`;
            }
            addLine("Marketing Budget", budgetString);
            addLine("Marketing Source (In-house/Outsourced)", formData.marketingSource);
            prompt += "\n**Creative Ideas & Preferences:**\n";
            addLine("Marketing Ideas to Explore", formData.marketingIdeas);
            addLine("Brand Voice or Tone", formData.brandVoice);
            addLine("Preferred Content Types", formData.contentTypes);
            addLine("Competitors", formData.competitors);
            prompt += "\nGenerate the strategy.";
            console.log("Generated Prompt:", prompt);

            // AI Strategy Generation and Modal Display
            if (validationPassed) {
                try {
                    const strategy = await generateAIStrategy(prompt);
                    if (strategy) {
                        const strategyModal = document.createElement("div");
                        strategyModal.className = "modal";
                        strategyModal.setAttribute("data-modal", "strategy-modal");
                        strategyModal.setAttribute("aria-hidden", "true");
                        strategyModal.innerHTML = `
                            <div class="modal-content strategy-modal-content">
                                <span class="close modal-close" aria-label="Close Strategy">&times;</span>
                                <h2>Your Marketing Strategy</h2>
                                <div class="strategy-content">
                                    ${strategy.replace(/\n/g, '<br>')}
                                </div>
                                <div class="strategy-actions">
                                    <button id="copy-strategy-btn" class="action-button">Copy to Clipboard</button>
                                    <button id="download-strategy-btn" class="action-button">Download as Text</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(strategyModal);
                        openModal("strategy-modal");
                        document.getElementById("copy-strategy-btn").addEventListener("click", () => {
                            navigator.clipboard.writeText(strategy)
                                .then(() => alert("Strategy copied to clipboard!"))
                                .catch(err => console.error("Error copying text: ", err));
                        });
                        document.getElementById("download-strategy-btn").addEventListener("click", () => {
                            const element = document.createElement("a");
                            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(strategy));
                            element.setAttribute("download", "bidayatna_marketing_strategy.txt");
                            element.style.display = "none";
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                        });
                    }
                } catch (error) {
                    console.error("Error in strategy generation process:", error);
                    alert("There was an error generating your strategy. Please try again later.");
                }
            }
        }); // End of submitBtn listener
    } // End of if(submitBtn)

    // --- Survey Form Submission Logic (Using FormSubmit) ---
    if (surveyForm) {
        const referralRadio = surveyForm.querySelectorAll("input[name=\"referral\"]");
        const socialSpecifyDiv = document.getElementById("social-media-specify");
        const referralOtherInput = document.getElementById("referral-other-specify");

        referralRadio.forEach(radio => {
            radio.addEventListener("change", () => {
                if (socialSpecifyDiv) socialSpecifyDiv.style.display = (radio.value === "social_media" && radio.checked) ? "block" : "none";
                if (referralOtherInput) referralOtherInput.style.display = (radio.value === "other" && radio.checked) ? "block" : "none";
                if (radio.value !== "social_media") {
                    surveyForm.querySelectorAll("input[name=\"social_platform\"]:checked").forEach(cb => cb.checked = false);
                }
                if (radio.value !== "other" && referralOtherInput) {
                    referralOtherInput.value = "";
                }
            });
        });

        surveyForm.addEventListener("submit", (event) => {
            let surveyValid = true;
            let firstSurveyErrorElement = null;
            surveyForm.querySelectorAll(".error-message").forEach(el => el.remove());
            surveyForm.querySelectorAll("[style*=\"border-color: red\"]").forEach(el => el.style.borderColor = "");

            surveyForm.querySelectorAll("[data-required=\"true\"]").forEach(group => {
                const groupLabel = group.previousElementSibling?.textContent || "This field";
                const requiredMsg = group.dataset.requiredMsg || `${groupLabel} is required.`;
                const inputs = group.querySelectorAll("input[type=\"radio\"], input[type=\"checkbox\"]");
                const isChecked = Array.from(inputs).some(input => input.checked);
                if (!isChecked) {
                    surveyValid = false;
                    event.preventDefault();
                    const errorDiv = document.createElement("div");
                    errorDiv.className = "error-message";
                    errorDiv.textContent = requiredMsg;
                    group.appendChild(errorDiv);
                    if (!firstSurveyErrorElement) firstSurveyErrorElement = inputs[0];
                }
            });

            surveyForm.querySelectorAll("input[type=\"text\"][required], textarea[required]").forEach(input => {
                if (!input.value.trim()) {
                    surveyValid = false;
                    event.preventDefault();
                    const groupLabel = input.previousElementSibling?.textContent || "This field";
                    const requiredMsg = input.dataset.requiredMsg || `${groupLabel} is required.`;
                    input.style.borderColor = "red";
                    const errorDiv = document.createElement("div");
                    errorDiv.className = "error-message";
                    errorDiv.style.marginLeft = "0";
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
            // If valid, FormSubmit handles the submission
        });
        
        // Check for survey=thanks in URL
        if (window.location.search.includes("survey=thanks")) {
            alert("Thank you for your feedback! We appreciate your input.");
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({path: newUrl}, "", newUrl);
        }
    } // End of if(surveyForm)

    // --- Cookie Consent Logic ---
    const cookieBanner = document.getElementById("cookie-consent-banner");
    const acceptCookiesBtn = document.getElementById("accept-cookies-btn");
    const privacyLinkInBanner = cookieBanner ? cookieBanner.querySelector("a[data-modal-trigger=\"privacy-modal-from-cookie\"]") : null;
    const consentGiven = localStorage.getItem("cookie_consent_given");

    if (cookieBanner && acceptCookiesBtn && !consentGiven) {
        cookieBanner.style.display = "flex";
        acceptCookiesBtn.addEventListener("click", () => {
            cookieBanner.style.display = "none";
            localStorage.setItem("cookie_consent_given", "true");
        });
        if (privacyLinkInBanner) {
            privacyLinkInBanner.setAttribute("data-modal-trigger", "privacy-modal");
            privacyLinkInBanner.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                openModal("privacy-modal");
            });
        }
    } // End of cookie consent logic

}); // End DOMContentLoaded

    // --- Goals Other Field Logic ---
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

    // --- Budget Period Other Field Logic ---
    const budgetPeriodSelect = document.getElementById("marketing-budget-period");
    const budgetPeriodOtherInput = document.getElementById("marketing-budget-period-other");
    if (budgetPeriodSelect && budgetPeriodOtherInput) {
        const checkBudgetPeriodOther = () => {
            budgetPeriodOtherInput.style.display = (budgetPeriodSelect.value === "other") ? "block" : "none";
            if (budgetPeriodSelect.value !== "other") budgetPeriodOtherInput.value = "";
        };
        budgetPeriodSelect.addEventListener("change", checkBudgetPeriodOther);
        checkBudgetPeriodOther(); // Initial check
    }



    // --- Social Media Other Field Logic ---
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
