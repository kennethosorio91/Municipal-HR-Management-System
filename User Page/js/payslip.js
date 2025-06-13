document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page with current month's payslip
    loadCurrentPayslip();
    loadPayslipHistory();
    loadBenefits();
    
    // Initialize calculator
    initializeCalculator();

    // Add event listener for the download current payslip button
    document.querySelector('.btn-download-payslip').addEventListener('click', function() {
        const currentDate = new Date();
        downloadPayslip(`${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`);
    });
});

// Load current month's payslip
async function loadCurrentPayslip() {
    try {
        // Get user's current salary grade and salary details
        const gradeResponse = await fetch('../handlers/get_salary_grade.php');
        const gradeData = await gradeResponse.json();
        
        if (gradeData.success) {
            // Pre-fill the calculator with user's salary grade
            const salaryGradeInput = document.getElementById('salaryGrade');
            if (salaryGradeInput) {
                salaryGradeInput.value = gradeData.data.salary_grade;
            }
            
            // Calculate and display current salary
            calculateSalary(gradeData.data.salary_grade);

            // Update current payslip section with actual salary data
            const currentDate = new Date();
            const monthNames = ["January", "February", "March", "April", "May", "June",
                              "July", "August", "September", "October", "November", "December"];
            
            // Calculate deductions
            const basicSalary = parseFloat(gradeData.data.basic_salary);
            const peraAllowance = parseFloat(gradeData.data.pera_allowance);
            
            // Standard deduction rates
            const gsisRate = 0.09; // 9% of basic salary
            const philhealthRate = 0.03; // 3% of basic salary
            const pagibigRate = 0.02; // 2% of basic salary
            const taxRate = 0.12; // 12% of taxable income (simplified)
            
            const gsisDeduction = basicSalary * gsisRate;
            const philhealthDeduction = basicSalary * philhealthRate;
            const pagibigDeduction = basicSalary * pagibigRate;
            const taxDeduction = basicSalary * taxRate;
            const totalDeductions = gsisDeduction + philhealthDeduction + pagibigDeduction + taxDeduction;
            
            // Calculate gross and net pay
            const grossPay = basicSalary + peraAllowance;
            const netPay = grossPay - totalDeductions;

            // Update payslip display
            document.querySelector('.payslip-header h2').textContent = 
                `Current Payslip - ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
            document.querySelector('.payslip-period').textContent = 
                `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

            // Update earnings section
            const earningsItems = document.querySelectorAll('.earnings-section .payslip-item .item-amount');
            earningsItems[0].textContent = formatCurrency(basicSalary); // Basic Salary
            earningsItems[1].textContent = formatCurrency(peraAllowance); // PERA Allowance
            earningsItems[2].textContent = formatCurrency(0); // Overtime (set to 0 by default)
            document.querySelector('.earnings-section .gross-pay .item-amount').textContent = 
                formatCurrency(grossPay);

            // Update deductions section
            const deductionsItems = document.querySelectorAll('.deductions-section .payslip-item .item-amount');
            deductionsItems[0].textContent = formatCurrency(gsisDeduction); // GSIS
            deductionsItems[1].textContent = formatCurrency(philhealthDeduction); // PhilHealth
            deductionsItems[2].textContent = formatCurrency(pagibigDeduction); // Pag-IBIG
            deductionsItems[3].textContent = formatCurrency(taxDeduction); // Tax
            document.querySelector('.deductions-section .total-deductions .item-amount').textContent = 
                formatCurrency(totalDeductions);

            // Update net pay section
            document.querySelector('.net-pay-amount').textContent = formatCurrency(netPay);
            document.querySelector('.net-pay-label').textContent = 
                `For ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else {
            console.error('Failed to load salary grade data:', gradeData.message);
            alert('Failed to load salary information. Please try again later.');
        }
    } catch (error) {
        console.error('Error loading payslip:', error);
        alert('An error occurred while loading the payslip information.');
    }
}

// Load payslip history
async function loadPayslipHistory() {
    try {
        // Get user's salary grade data
        const gradeResponse = await fetch('../handlers/get_salary_grade.php');
        const gradeData = await gradeResponse.json();
        
        if (!gradeData.success) {
            throw new Error(gradeData.error || 'Failed to load salary data');
        }

        // Generate last 6 months of payslip history
        const history = [];
        const currentDate = new Date();
        
        for (let i = 1; i <= 6; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const basicSalary = parseFloat(gradeData.data.basic_salary);
            const peraAllowance = parseFloat(gradeData.data.pera_allowance);
            
            // Calculate deductions
            const gsisDeduction = basicSalary * 0.09;
            const philhealthDeduction = basicSalary * 0.03;
            const pagibigDeduction = basicSalary * 0.02;
            const taxDeduction = basicSalary * 0.12;
            const totalDeductions = gsisDeduction + philhealthDeduction + pagibigDeduction + taxDeduction;
            
            // Calculate net pay
            const grossPay = basicSalary + peraAllowance;
            const netPay = grossPay - totalDeductions;

            history.push({
                pay_period: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
                net_pay: netPay,
                basic_salary: basicSalary,
                pera_allowance: peraAllowance,
                deductions: {
                    gsis: gsisDeduction,
                    philhealth: philhealthDeduction,
                    pagibig: pagibigDeduction,
                    tax: taxDeduction,
                    total: totalDeductions
                }
            });
        }

        updatePayslipHistory(history);
    } catch (error) {
        console.error('Error loading payslip history:', error);
    }
}

// Update payslip history display
function updatePayslipHistory(history) {
    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = '';
    
    history.forEach(payslip => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-info">
                <h3>${formatDate(payslip.pay_period)}</h3>
                <p>Net Pay: ${formatCurrency(payslip.net_pay)}</p>
            </div>
            <div class="history-actions">
                <button class="btn-view" onclick="viewPayslip('${payslip.pay_period}')">View</button>
                <button class="btn-download" onclick="downloadPayslip('${payslip.pay_period}')">Download</button>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Load benefits and bonuses
async function loadBenefits() {
    try {
        const response = await fetch('../handlers/fetch_benefits.php');
        const data = await response.json();
        
        if (data.success) {
            updateBenefitsDisplay(data.data);
        }
    } catch (error) {
        console.error('Error loading benefits:', error);
    }
}

// Update benefits display
function updateBenefitsDisplay(benefits) {
    const benefitsGrid = document.querySelector('.benefits-grid');
    benefitsGrid.innerHTML = '';
    
    benefits.forEach(benefit => {
        const benefitItem = document.createElement('div');
        benefitItem.className = 'benefit-item';
        benefitItem.innerHTML = `
            <div class="benefit-info">
                <h3>${benefit.benefit_type}</h3>
                <div class="benefit-amount">${formatCurrency(benefit.amount)}</div>
                <div class="benefit-date">${formatDate(benefit.date_granted)}</div>
            </div>
            <div class="benefit-status ${benefit.status.toLowerCase()}">${benefit.status}</div>
        `;
        benefitsGrid.appendChild(benefitItem);
    });
}

// Initialize salary calculator
function initializeCalculator() {
    const calculateBtn = document.querySelector('.calculate-btn');
    const calculatorBtn = document.querySelector('.btn-calculator');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', () => calculateSalary());
    }
    
    if (calculatorBtn) {
        calculatorBtn.addEventListener('click', () => {
            const calculatorContent = document.querySelector('.calculator-content');
            if (calculatorContent) {
                calculatorContent.style.display = calculatorContent.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
}

// Calculate salary based on grade
async function calculateSalary(grade) {
    const salaryGrade = grade || document.getElementById('salaryGrade').value;
    
    if (!salaryGrade || salaryGrade < 1 || salaryGrade > 33) {
        alert('Please enter a valid salary grade (1-33)');
        return;
    }
    
    try {
        console.log('Calculating salary for grade:', salaryGrade);
        const response = await fetch(`../handlers/calculate_salary.php?salary_grade=${salaryGrade}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Calculation response:', data);
        
        if (data.success) {
            displayCalculationResults(data.data);
            
            // Show the results container
            const resultsContainer = document.querySelector('.calculation-results');
            if (resultsContainer) {
                resultsContainer.style.display = 'block';
            }
        } else {
            alert('Failed to calculate salary: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error calculating salary:', error);
        alert('An error occurred while calculating the salary. Please check the console for details.');
    }
}

// Display calculation results
function displayCalculationResults(results) {
    const monthlyResults = document.querySelector('.monthly-results');
    const quarterlyResults = document.querySelector('.quarterly-results');
    const annualResults = document.querySelector('.annual-results');
    
    // Update monthly results
    monthlyResults.innerHTML = `
        <h4>Monthly Projection</h4>
        <div class="result-item">
            <span class="result-label">Basic Salary:</span>
            <span class="result-value">${formatCurrency(results.monthly.basic_salary)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">PERA:</span>
            <span class="result-value">${formatCurrency(results.monthly.allowance)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Gross Salary:</span>
            <span class="result-value">${formatCurrency(results.monthly.gross_salary)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total Deductions:</span>
            <span class="result-value">${formatCurrency(results.monthly.deductions.total_deductions)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Net Salary:</span>
            <span class="result-value">${formatCurrency(results.monthly.net_salary)}</span>
        </div>
    `;
    
    // Update quarterly results
    quarterlyResults.innerHTML = `
        <h4>Quarterly Projection</h4>
        <div class="result-item">
            <span class="result-label">Gross Salary:</span>
            <span class="result-value">${formatCurrency(results.quarterly.gross_salary)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Net Salary:</span>
            <span class="result-value">${formatCurrency(results.quarterly.net_salary)}</span>
        </div>
    `;
    
    // Update annual results
    annualResults.innerHTML = `
        <h4>Annual Projection</h4>
        <div class="result-item">
            <span class="result-label">Gross Salary:</span>
            <span class="result-value">${formatCurrency(results.annual.gross_salary)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Net Salary:</span>
            <span class="result-value">${formatCurrency(results.annual.net_salary)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Mid-Year Bonus:</span>
            <span class="result-value">${formatCurrency(results.annual.mid_year_bonus)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Year-End Bonus:</span>
            <span class="result-value">${formatCurrency(results.annual.year_end_bonus)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">13th Month Pay:</span>
            <span class="result-value">${formatCurrency(results.annual.thirteenth_month)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total Annual Compensation:</span>
            <span class="result-value">${formatCurrency(results.annual.total_compensation)}</span>
        </div>
    `;
}

// View specific payslip
async function viewPayslip(payPeriod) {
    try {
        // Get user's salary grade data
        const gradeResponse = await fetch('../handlers/get_salary_grade.php');
        const gradeData = await gradeResponse.json();
        
        if (!gradeData.success) {
            throw new Error(gradeData.error || 'Failed to load salary data');
        }

        // Calculate payslip data for the selected period
        const basicSalary = parseFloat(gradeData.data.basic_salary);
        const peraAllowance = parseFloat(gradeData.data.pera_allowance);
        
        // Calculate deductions
        const gsisDeduction = basicSalary * 0.09;
        const philhealthDeduction = basicSalary * 0.03;
        const pagibigDeduction = basicSalary * 0.02;
        const taxDeduction = basicSalary * 0.12;
        const totalDeductions = gsisDeduction + philhealthDeduction + pagibigDeduction + taxDeduction;
        
        // Calculate net pay
        const grossPay = basicSalary + peraAllowance;
        const netPay = grossPay - totalDeductions;

        // Update the current payslip display with the historical data
        const [year, month] = payPeriod.split('-');
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        
        document.querySelector('.payslip-header h2').textContent = 
            `Payslip - ${monthNames[parseInt(month) - 1]} ${year}`;
        document.querySelector('.payslip-period').textContent = 
            `${monthNames[parseInt(month) - 1]} ${year}`;

        // Update earnings section
        const earningsItems = document.querySelectorAll('.earnings-section .payslip-item .item-amount');
        earningsItems[0].textContent = formatCurrency(basicSalary);
        earningsItems[1].textContent = formatCurrency(peraAllowance);
        earningsItems[2].textContent = formatCurrency(0);
        document.querySelector('.earnings-section .gross-pay .item-amount').textContent = 
            formatCurrency(grossPay);

        // Update deductions section
        const deductionsItems = document.querySelectorAll('.deductions-section .payslip-item .item-amount');
        deductionsItems[0].textContent = formatCurrency(gsisDeduction);
        deductionsItems[1].textContent = formatCurrency(philhealthDeduction);
        deductionsItems[2].textContent = formatCurrency(pagibigDeduction);
        deductionsItems[3].textContent = formatCurrency(taxDeduction);
        document.querySelector('.deductions-section .total-deductions .item-amount').textContent = 
            formatCurrency(totalDeductions);

        // Update net pay section
        document.querySelector('.net-pay-amount').textContent = formatCurrency(netPay);
        document.querySelector('.net-pay-label').textContent = 
            `For ${monthNames[parseInt(month) - 1]} ${year}`;

    } catch (error) {
        console.error('Error loading payslip details:', error);
        alert('Failed to load payslip details. Please try again later.');
    }
}

// Download payslip
async function downloadPayslip(payPeriod) {
    try {
        // Get user's salary grade data
        const gradeResponse = await fetch('../handlers/get_salary_grade.php');
        const gradeData = await gradeResponse.json();
        
        if (!gradeData.success) {
            throw new Error(gradeData.error || 'Failed to load salary data');
        }

        // Calculate payslip data
        const basicSalary = parseFloat(gradeData.data.basic_salary);
        const peraAllowance = parseFloat(gradeData.data.pera_allowance);
        
        // Calculate deductions
        const gsisDeduction = basicSalary * 0.09;
        const philhealthDeduction = basicSalary * 0.03;
        const pagibigDeduction = basicSalary * 0.02;
        const taxDeduction = basicSalary * 0.12;
        const totalDeductions = gsisDeduction + philhealthDeduction + pagibigDeduction + taxDeduction;
        
        // Calculate net pay
        const grossPay = basicSalary + peraAllowance;
        const netPay = grossPay - totalDeductions;

        // Create payslip content
        const [year, month] = payPeriod.split('-');
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        
        const payslipContent = `
Municipality of Concepcion
Payslip for ${monthNames[parseInt(month) - 1]} ${year}

EARNINGS
Basic Salary: ${formatCurrency(basicSalary)}
PERA Allowance: ${formatCurrency(peraAllowance)}
Overtime: ${formatCurrency(0)}
Gross Pay: ${formatCurrency(grossPay)}

DEDUCTIONS
GSIS: ${formatCurrency(gsisDeduction)}
PhilHealth: ${formatCurrency(philhealthDeduction)}
Pag-IBIG: ${formatCurrency(pagibigDeduction)}
Withholding Tax: ${formatCurrency(taxDeduction)}
Total Deductions: ${formatCurrency(totalDeductions)}

NET PAY: ${formatCurrency(netPay)}
`;

        // Create blob and download
        const blob = new Blob([payslipContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip_${payPeriod}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error('Error downloading payslip:', error);
        alert('Failed to download payslip. Please try again later.');
    }
}

// Format currency helper function
function formatCurrency(amount) {
    return '₱' + parseFloat(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Format date helper function
function formatDate(dateString) {
    const date = new Date(dateString);
    const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}


