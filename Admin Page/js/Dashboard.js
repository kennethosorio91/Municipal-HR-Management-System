document.addEventListener('DOMContentLoaded', function() {
    fetchEmployeeStats();
    fetchDepartmentData();
    fetchEmploymentTypeData();
});

function fetchEmployeeStats() {
    fetch('../handlers/get_employees.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const employees = data.data;
                const totalEmployees = employees.length;
                const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
                const activeRate = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

                updateStatCard('totalEmployeesStat', totalEmployees);
                updateStatCard('activeRateStat', activeRate + '%');
                
                const absentEmployees = employees.filter(emp => emp.status === 'On Leave' || emp.status === 'Inactive').length;
                updateStatCard('totalAbsentStat', absentEmployees); 
            } else {
                console.error('Failed to load employee stats:', data.message);
                // Optionally display an error or default values
                updateStatCard('totalEmployeesStat', 'N/A');
                updateStatCard('activeRateStat', 'N/A');
            }
        })
        .catch(error => {
            console.error('Error fetching employee stats:', error);
            updateStatCard('totalEmployeesStat', 'Error');
            updateStatCard('activeRateStat', 'Error');
        });
}

function fetchDepartmentData() {
    fetch('../handlers/get_department_stats.php')
        .then(response => response.json())
        .then(data => {
            console.log('Department data received:', data);
            if (data.success && data.data && data.data.length > 0) {
                renderDepartmentChart(data.data);
            } else {
                console.warn('No department data available:', data);
                // Show a message instead of sample data
                document.getElementById('departmentChart').innerHTML = 
                    '<div class="no-data-message">No department data available</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching department data:', error);
            document.getElementById('departmentChart').innerHTML = 
                '<div class="error-message">Error loading department data</div>';
        });
}

// Function removed - not needed

function fetchEmploymentTypeData() {
    fetch('../handlers/get_employment_types.php')
        .then(response => response.json())
        .then(data => {
            console.log('Employment type data received:', data);
            if (data.success && data.data && data.data.length > 0) {
                renderEmploymentTypeChart(data.data);
            } else {
                console.warn('No employment type data available:', data);
                // Show a message instead of sample data
                document.getElementById('employmentTypeChart').innerHTML = 
                    '<div class="no-data-message">No employment type data available</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching employment type data:', error);
            document.getElementById('employmentTypeChart').innerHTML = 
                '<div class="error-message">Error loading employment type data</div>';
        });
}

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function renderDepartmentChart(departments) {
    const container = document.getElementById('departmentChart');
    container.innerHTML = '';

    // Check if we have valid data
    if (!departments || !departments.length) {
        container.innerHTML = '<div class="no-data-message">No department data available</div>';
        return;
    }

    // Sort departments by count in descending order
    departments.sort((a, b) => b.count - a.count);
    
    // Get maximum count for percentage calculations
    const maxCount = Math.max(...departments.map(dept => parseInt(dept.count)));
    
    // Color array for the bars
    const colors = [
        '#2C6159', '#3C8C7E', '#4DB3A2', '#5ED9C5', 
        '#80E2D1', '#A1EBDD', '#C3F4E9', '#E5FCF5'
    ];

    // Create a total count display
    const totalCount = departments.reduce((sum, dept) => sum + parseInt(dept.count), 0);
    const totalElement = document.createElement('div');
    totalElement.className = 'department-total';
    totalElement.textContent = `Total Employees: ${totalCount}`;
    container.appendChild(totalElement);

    // Create the bars
    const barsContainer = document.createElement('div');
    barsContainer.className = 'department-bars';
    
    departments.forEach((dept, index) => {
        const percentage = (dept.count / maxCount) * 100;
        const color = colors[index % colors.length];

        const barItem = document.createElement('div');
        barItem.className = 'department-bar-item';
        
        barItem.innerHTML = `
            <div class="department-bar-header">
                <span class="department-name">${dept.department}</span>
                <span class="department-count">${dept.count}</span>
            </div>
            <div class="bar-container">
                <div class="bar" style="width: ${percentage}%; background-color: ${color};"></div>
            </div>
        `;
        
        barsContainer.appendChild(barItem);
    });
    
    container.appendChild(barsContainer);
}

function renderStatusChart(statusData) {
    const container = document.getElementById('statusChart');
    container.innerHTML = '';
    
    // Set up dimensions for SVG
    const size = Math.min(300, container.clientWidth);
    const radius = size / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Color mapping for different statuses
    const colorMap = {
        'Active': '#27AE60',
        'On Leave': '#F2994A',
        'Inactive': '#EB5757',
        'Probation': '#2F80ED',
        'Contract': '#9B51E0',
        'No data': '#E0E0E0'
    };
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    
    // Calculate total for percentages
    const total = statusData.reduce((sum, item) => sum + item.count, 0);
    
    // Draw pie chart segments
    let startAngle = 0;
    const legend = document.createElement('div');
    legend.className = 'status-legend';
    
    statusData.forEach((item, index) => {
        const percentage = (item.count / total) * 100;
        const endAngle = startAngle + (percentage / 100) * 2 * Math.PI;
        
        // Calculate the path for the arc
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        // Create arc path
        const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', colorMap[item.status] || `hsl(${index * 40}, 70%, 50%)`);
        svg.appendChild(path);
        
        // Add to legend
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${colorMap[item.status] || `hsl(${index * 40}, 70%, 50%)`}"></div>
            <span class="legend-label">${item.status}: ${percentage.toFixed(1)}%</span>
        `;
        legend.appendChild(legendItem);
        
        startAngle = endAngle;
    });
    
    // Add circle in the middle for donut chart effect
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', centerX);
    innerCircle.setAttribute('cy', centerY);
    innerCircle.setAttribute('r', radius * 0.6);
    innerCircle.setAttribute('fill', 'white');
    svg.appendChild(innerCircle);
    
    // Add percentage text in the middle
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', centerX);
    text.setAttribute('y', centerY);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '16px');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#333');
    text.textContent = `${total} Total`;
    svg.appendChild(text);
    
    container.appendChild(svg);
    container.appendChild(legend);
}

function renderEmploymentTypeChart(employmentTypes) {
    const container = document.getElementById('employmentTypeChart');
    if (!container) {
        console.error('Employment type chart container not found');
        return;
    }
    container.innerHTML = '';

    // Check if we have valid data
    if (!employmentTypes || !employmentTypes.length) {
        container.innerHTML = '<div class="no-data-message">No employment type data available</div>';
        return;
    }

    // Calculate total for percentages
    const total = employmentTypes.reduce((sum, type) => sum + parseInt(type.count), 0);
    
    // Color mapping for different employment types
    const colorMap = {
        'Permanent': '#27AE60',
        'Contractual': '#2F80ED',
        'Job Order': '#EB5757',
        'Probationary': '#A259FF'
    };

    // Create SVG for the pie chart
    const svgSize = 240;
    const radius = svgSize / 2;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgSize);
    svg.setAttribute('height', svgSize);
    svg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);
    svg.setAttribute('class', 'employment-type-chart');

    // Create a group for the pie chart
    const pieGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pieGroup.setAttribute('transform', `translate(${radius},${radius})`);
    svg.appendChild(pieGroup);

    // Draw the pie slices
    let startAngle = 0;
    const legend = document.createElement('div');
    legend.className = 'chart-legend';

    employmentTypes.forEach((type, index) => {
        const count = parseInt(type.count);
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const endAngle = startAngle + (percentage / 100) * 2 * Math.PI;
        
        // Calculate the path for the arc
        const x1 = radius * Math.cos(startAngle - Math.PI/2);
        const y1 = radius * Math.sin(startAngle - Math.PI/2);
        const x2 = radius * Math.cos(endAngle - Math.PI/2);
        const y2 = radius * Math.sin(endAngle - Math.PI/2);
        
        // Create arc path
        const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
        const pathData = [
            `M 0 0`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');
        
        // Get color for this type
        const color = colorMap[type.type] || `hsl(${index * 50}, 70%, 50%)`;
        
        // Create path element
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', color);
        path.setAttribute('stroke', '#fff');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('data-type', type.type);
        path.setAttribute('data-count', count);
        path.setAttribute('data-percentage', percentage.toFixed(1) + '%');
        
        // Add tooltip title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${type.type}: ${count} (${percentage.toFixed(1)}%)`;
        path.appendChild(title);
        
        // Add path to pie group
        pieGroup.appendChild(path);
        
        // Create legend item
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${color}"></span>
            <span class="legend-label">${type.type}</span>
            <span class="legend-value">${count}</span>
            <span class="legend-percentage">${percentage.toFixed(1)}%</span>
        `;
        legend.appendChild(legendItem);
        
        startAngle = endAngle;
    });

    // Add a white circle in the center for donut effect
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', radius * 0.6);
    circle.setAttribute('fill', 'white');
    pieGroup.appendChild(circle);

    // Add text in the center
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('alignment-baseline', 'middle');
    text.setAttribute('font-size', '16px');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#333');
    text.textContent = total;
    pieGroup.appendChild(text);

    const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subText.setAttribute('x', '0');
    subText.setAttribute('y', '20');
    subText.setAttribute('text-anchor', 'middle');
    subText.setAttribute('alignment-baseline', 'middle');
    subText.setAttribute('font-size', '12px');
    subText.setAttribute('fill', '#666');
    subText.textContent = 'TOTAL';
    pieGroup.appendChild(subText);

    // Add chart to container
    container.appendChild(svg);
    container.appendChild(legend);
}
