<script>
    import { onMount } from 'svelte';
    
    // Helper function to format dates
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    };
    
    // Generate mock patient data with 5-day visit windows repeating monthly
    const generatePatientVisits = () => {
        const patients = [
            { id: 1, name: 'John Smith', color: '#4ade80' },
            { id: 2, name: 'Sarah Johnson', color: '#60a5fa' },
            { id: 3, name: 'Michael Davis', color: '#f97316' },
            { id: 4, name: 'Emma Wilson', color: '#a78bfa' },
            { id: 5, name: 'Robert Brown', color: '#f43f5e' }
        ];
        
        const events = [];
        const today = new Date();
        
        // Start from the beginning of the current month
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Generate events for the next 6 months
        for (let month = 0; month < 6; month++) {
            // Create a more natural pattern of visits with some overlap
            // Each patient has a base day within the month
            const baseDays = [3, 8, 5, 12, 10]; // More irregular pattern than the evenly spaced previous approach
            
            patients.forEach((patient, index) => {
                // Add some randomness to create a more natural pattern
                // while maintaining the same schedule rhythm for each patient
                const dayVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1 day variation
                const visitStart = new Date(startDate);
                visitStart.setMonth(startDate.getMonth() + month);
                
                // Base day + some variation but keep it within month bounds
                let startDay = baseDays[index] + dayVariation;
                if (startDay < 1) startDay = 1;
                const daysInMonth = new Date(visitStart.getFullYear(), visitStart.getMonth() + 1, 0).getDate();
                if (startDay > daysInMonth - 5) startDay = daysInMonth - 5; // Ensure 5 day window fits in month
                
                visitStart.setDate(startDay);
                
                const visitEnd = new Date(visitStart);
                visitEnd.setDate(visitStart.getDate() + 4); // 5-day window
                
                events.push({
                    id: `visit-${patient.id}-${month}`,
                    patientId: patient.id,
                    patientName: patient.name,
                    start: visitStart,
                    end: visitEnd,
                    color: patient.color
                });
            });
        }
        
        return events;
    };
    
    // Calendar state
    let currentDate = new Date();
    let visibleMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    let calendarDays = [];
    let events = [];
    
    // Generate calendar days for the visible month
    const generateCalendarDays = () => {
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();
        
        // Get the first day of the month
        const firstDay = new Date(year, month, 1);
        // Get the last day of the month
        const lastDay = new Date(year, month + 1, 0);
        
        // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
        const firstDayIndex = firstDay.getDay();
        
        // Calculate the number of days to display from the previous month
        const prevMonthDays = firstDayIndex;
        
        // Calculate the total number of days to display
        const totalDays = prevMonthDays + lastDay.getDate();
        
        // Calculate rows needed (7 days per row)
        const rows = Math.ceil(totalDays / 7);
        const totalCells = rows * 7;
        
        const days = [];
        
        // Add days from previous month
        const prevMonth = new Date(year, month - 1, 0);
        const prevMonthLastDay = prevMonth.getDate();
        
        for (let i = 0; i < prevMonthDays; i++) {
            const day = prevMonthLastDay - prevMonthDays + i + 1;
            days.push({
                date: new Date(year, month - 1, day),
                isCurrentMonth: false
            });
        }
        
        // Add days from current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }
        
        // Add days from next month
        const remainingDays = totalCells - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }
        
        return days;
    };
    
    // Navigate to previous month
    const prevMonth = () => {
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
        calendarDays = generateCalendarDays();
    };
    
    // Navigate to next month
    const nextMonth = () => {
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
        calendarDays = generateCalendarDays();
    };
    
    // Check if a day has events
    const getEventsForDay = (date) => {
        return events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return date >= eventStart && date <= eventEnd;
        });
    };
    
    onMount(() => {
        events = generatePatientVisits();
        calendarDays = generateCalendarDays();
    });
</script>

<div class="container mx-auto p-6 max-w-8xl">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold mb-2">Patient Visit Schedule</h1>
        <div class="flex gap-4 items-center">
            <button class="btn btn-primary btn-sm" on:click={prevMonth}>Previous Month</button>
            <h2 class="text-xl font-semibold">
                {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button class="btn btn-primary btn-sm" on:click={nextMonth}>Next Month</button>
        </div>
    </div>
    
    <div class="card bg-base-100 shadow-xl overflow-hidden">
        <!-- Calendar header -->
        <div class="grid grid-cols-7 gap-px bg-base-300">
            {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
                <div class="p-2 text-center font-medium">{day}</div>
            {/each}
        </div>
        
        <!-- Calendar days -->
        <div class="grid grid-cols-7 gap-px bg-base-300">
            {#each calendarDays as day}
                <div class="p-2 min-h-24 bg-base-100 {day.isCurrentMonth ? '' : 'text-base-300'}">
                    <div class="font-medium">{day.date.getDate()}</div>
                    <div class="mt-1 space-y-1">
                        {#each getEventsForDay(day.date) as event}
                            <div 
                                class="text-xs p-1 rounded truncate" 
                                style="background-color: {event.color}20; color: {event.color}; border-left: 3px solid {event.color};"
                                title="{event.patientName}: {formatDate(event.start)} - {formatDate(event.end)}"
                            >
                                {event.patientName}
                                {#if day.date.getTime() === event.start.getTime()}
                                    (Start)
                                {/if}
                                {#if day.date.getTime() === event.end.getTime()}
                                    (End)
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
    
    <div class="mt-6">
        <h3 class="text-lg font-semibold mb-2">Patient Visit Windows</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {#each events.filter(e => e.start >= new Date() && e.start <= new Date(new Date().setMonth(new Date().getMonth() + 2))) as event}
                <div class="card p-3 border-l-4" style="border-color: {event.color};">
                    <div class="font-medium">{event.patientName}</div>
                    <div class="text-sm text-opacity-70">
                        {formatDate(event.start)} - {formatDate(event.end)}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>


