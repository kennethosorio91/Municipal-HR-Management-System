document.addEventListener('DOMContentLoaded', function() {
    fetchEmployeeStats();
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
                
                // Assuming you might want to update other stats like Total Absent
                const absentEmployees = employees.filter(emp => emp.status === 'On Leave' || emp.status === 'Inactive').length; // Or however 'absent' is defined
                // updateStatCard('totalAbsentStat', absentEmployees); // Add an ID to the HTML for this
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

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}
