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
        const proxyApiUrl = "/api/together-ai-proxy"; // For Vercel

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
                body: JSON.stringify({ prompt: promptText }),
            });

            if (document.body.contains(loadingElement)) {
                document.body.removeChild(loadingElement);
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Proxy API Error:", response.status, errorData);
                throw new Error(`Proxy API request failed with status ${response.status}: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices.length > 0 && data.choices[0].text) {
                return data.choices[0].text.trim();
            } else {
                console.error("Invalid response structure from proxy:", data);
                return "No valid response from AI."; // Or a more descriptive error
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

            let prompt = "You are an expert marketing strategist. Analyze the following business details to generate a comprehensive marketing strategy.\n";
            prompt += "The primary target market is the Middle East, with a strong emphasis on Saudi Arabia, though the strategy should also consider broader international appeal if appropriate for the business type.\n";
            prompt += "All financial figures, especially budget allocations and ROI, must be presented in SAR (Saudi Riyal). Ensure all timeframes mentioned are specific (e.g., in days, weeks, months, or years).\n";
            prompt += "\nBusiness Information Provided:\n";

            const addLine = (label, value, emptyText = "[AI to determine/suggest based on other inputs and industry best practices]") => {
                const notProvidedExceptions = [
                    "Website", "Current Users/Customers", "Target Locations / Countries",
                    "Languages Spoken", "Primary Goals"
                ];
                const isEmpty = (value === null || value === "" || value === undefined || (Array.isArray(value) && value.length === 0));
                
                let effectiveEmptyText = emptyText;
                if (isEmpty && notProvidedExceptions.includes(label)) {
                    effectiveEmptyText = "[Not Provided by User]";
                }
                if (label === "Timeframe for Goals" && (!formData.primaryGoals || formData.primaryGoals.length === 0)) {
                    effectiveEmptyText = "[Not Provided by User]";
                }

                if (!isEmpty) {
                    prompt += `- ${label}: ${Array.isArray(value) ? value.join(", ") : value}\n`;
                } else {
                    prompt += `- ${label}: ${effectiveEmptyText}\n`;
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

            prompt += "\nRequired Strategy Structure: Please provide a detailed, actionable marketing strategy. It must include these sections: Executive Summary, Target Audience Deep Dive (with consideration for the Saudi Arabian market), Key Marketing Objectives (SMART), Core Messaging & Positioning, Recommended Marketing Channels & Tactics (with rationale), Content Strategy Outline, Budget Allocation Suggestions (in SAR), KPIs & Measurement Plan, and a detailed Timeline/Roadmap with clear durations.";
            prompt += "\nIMPORTANT INSTRUCTION: Generate only the marketing strategy content. Do not include any conversational notes, meta-commentary about the prompt, or restate the instructions given to you. Focus solely on delivering the professional strategy document.";

            console.log("SCRIPT_LOG: Generated Prompt for AI:", prompt);

            const aiStrategy = await generateAIStrategy(prompt);

            if (aiStrategy && aiStrategy !== "No valid response from AI.") {
                console.log("SCRIPT_LOG: AI Generated Strategy Received:", aiStrategy.substring(0, 200) + "...");
                const strategyModalContent = document.createElement("div");
                strategyModalContent.style.whiteSpace = "pre-wrap";
                strategyModalContent.textContent = aiStrategy;
                
                const resultModal = document.createElement("div");
                resultModal.className = "modal is-open";
                resultModal.setAttribute("data-modal", "strategy-result-modal");
                resultModal.setAttribute("aria-hidden", "false");
                const resultContent = document.createElement("div");
                resultContent.className = "modal-content";
                const closeBtn = document.createElement("span");
                closeBtn.className = "close modal-close";
                closeBtn.innerHTML = "&times;";
                closeBtn.onclick = () => {
                    closeModal(resultModal);
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
                showOverlay();
                openModal("strategy-result-modal");
            } else {
                console.error("SCRIPT_LOG: Strategy generation failed or returned an invalid/empty response.");
                alert("Strategy generation failed. The AI did not provide a valid response. Please check the console for more details or try adjusting your inputs.");
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
                    if (inputs.length > 0) inputs[0].focus();
                }
            });

            if (missingRequired) {
                event.preventDefault();
            }
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
                    otherInputElement.value = "";
                }
            };
            selectElement.addEventListener("change", checkOther);
            checkOther();
        }
    }

    setupConditionalInput("marketing-budget-period", "marketing-budget-period-other");

    const socialOtherCheckbox = document.querySelector("input[name=\"social\"][value=\"other\"]");
    const socialOtherDescriptionInput = document.getElementById("social-other-description");
    if (socialOtherCheckbox && socialOtherDescriptionInput) {
        const checkSocialOther = () => {
            socialOtherDescriptionInput.style.display = socialOtherCheckbox.checked ? "block" : "none";
            if (!socialOtherCheckbox.checked) socialOtherDescriptionInput.value = "";
        };
        socialOtherCheckbox.addEventListener("change", checkSocialOther);
        checkSocialOther();
    }

    const goalsOtherCheckbox = document.querySelector("input[name=\"goals\"][value=\"other\"]");
    const goalsOtherDescriptionInput = document.getElementById("goals-other-description");
    if (goalsOtherCheckbox && goalsOtherDescriptionInput) {
        const checkGoalsOther = () => {
            goalsOtherDescriptionInput.style.display = goalsOtherCheckbox.checked ? "block" : "none";
            if (!goalsOtherCheckbox.checked) goalsOtherDescriptionInput.value = "";
        };
        goalsOtherCheckbox.addEventListener("change", checkGoalsOther);
        checkGoalsOther();
    }
    
    // --- Cookie Consent Banner Logic ---
    const cookieBanner = document.getElementById("cookie-consent-banner");
    const acceptCookiesBtn = document.getElementById("accept-cookies-btn");
    const privacyLinkFromCookie = document.querySelector("[data-modal-trigger=\"privacy-modal-from-cookie\"]");

    if (localStorage.getItem("cookieConsent") !== "accepted") {
        if (cookieBanner) cookieBanner.style.display = "block";
    }

    if (acceptCookiesBtn) {
        acceptCookiesBtn.addEventListener("click", () => {
            localStorage.setItem("cookieConsent", "accepted");
            if (cookieBanner) cookieBanner.style.display = "none";
        });
    }
    
    if (privacyLinkFromCookie) {
        privacyLinkFromCookie.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openModal("privacy-modal");
        });
    }

});
