// main.ts
import './style.css'
import Alpine from 'alpinejs'
import {
    countDaysInQuarter,
    getQuarterInfo,
    DaySunday,
    DayMonday,
    DayTuesday,
    DayWednesday,
    DayThursday, DayFriday, DaySaturday, getAbsoluteDayNumber
} from "./date.ts";
import { availableCountries } from './countries.ts';

window.Alpine = Alpine

interface Holiday {
    date: string; // ISO date string
}

Alpine.data('quarterStats', () => ({
    workhoursPerDay: 8,
    weekDays: [
        { label: 'Sun', value: DaySunday },
        { label: 'Mon', value: DayMonday },
        { label: 'Tue', value: DayTuesday },
        { label: 'Wed', value: DayWednesday },
        { label: 'Thu', value: DayThursday },
        { label: 'Fri', value: DayFriday },
        { label: 'Sat', value: DaySaturday },
    ],
    selectedWorkdays: [DayMonday, DayTuesday, DayWednesday, DayThursday, DayFriday],
    customDate: '',
    customTime: '',
    factorInHolidays: false,
    countries: availableCountries,
    selectedCountry: '',
    holidays: [] as Holiday[],
    holidaysLoading: false,
    async fetchHolidays() {
        if (!this.factorInHolidays || !this.selectedCountry || this.holidaysLoading) return;
        this.holidaysLoading = true;
        try {
            const year = this.quarterInfo.year;
            const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${this.selectedCountry}`);
            this.holidays = await res.json();
        } finally {
            this.holidaysLoading = false;
        }
    },
    loadSettings() {
        const saved = localStorage.getItem('quarterSettings');
        if (saved) {
            try {
                const obj = JSON.parse(saved);
                if (obj.selectedCountry) this.selectedCountry = obj.selectedCountry;
                if (obj.factorInHolidays) this.factorInHolidays = obj.factorInHolidays;
                if (obj.selectedWorkdays) this.selectedWorkdays = obj.selectedWorkdays;
                if (obj.hoursPerDay) this.workhoursPerDay = obj.hoursPerDay;
            } catch (e) {}
        }
    },
    saveSettings() {
        const obj = {
            factorInHolidays: this.factorInHolidays,
            selectedCountry: this.selectedCountry,
            selectedWorkdays: this.selectedWorkdays,
            hoursPerDay: this.workhoursPerDay
        };
        localStorage.setItem('quarterSettings', JSON.stringify(obj));
    },
    async init() {
        this.loadSettings();
        // Set default date and time pickers to current date and time
        const now = new Date();
        this.customDate = now.toISOString().slice(0, 10);
        this.customTime = now.toTimeString().slice(0, 5);
        if (this.countries.length > 0 && !this.selectedCountry) {
            this.selectedCountry = this.countries[0].countryCode;
        }
        if (this.factorInHolidays) {
            await this.fetchHolidays();
        }
    },
    get now() {
        if (this.customDate && this.customTime) {
            // Combine date and time into a single ISO string
            return new Date(this.customDate + 'T' + this.customTime);
        } else if (this.customDate) {
            return new Date(this.customDate);
        }
        return new Date();
    },
    get quarterInfo() {
        return getQuarterInfo(this.now);
    },
    get quarterLabel() {
        const { year, quarter } = this.quarterInfo;
        return `Q${quarter} ${year}`;
    },
    get totalWorkDays() {
        let {amountOfWorkDays} = countDaysInQuarter(this.quarterInfo.quarterStartDate, this.quarterInfo.quarterEndDate, this.selectedWorkdays);
        if (this.factorInHolidays && this.holidays.length > 0) {
            // Subtract holidays that fall on selected workdays and within the quarter
            amountOfWorkDays -= this.holidays.filter(h => {
                const d = new Date(h.date);
                return d >= this.quarterInfo.quarterStartDate && d < this.quarterInfo.quarterEndDate && this.selectedWorkdays.includes(d.getDay());
            }).length;
        }
        return amountOfWorkDays;
    },
    get totalDays() {
        let {totalAmountOfDays} = countDaysInQuarter(this.quarterInfo.quarterStartDate, this.quarterInfo.quarterEndDate, this.selectedWorkdays);
        return totalAmountOfDays;
    },
    get remainingWorkDays() {
        return this.remainingWorkhours / this.workhoursPerDay;
    },
    get remainingDays() {
        return this.remainingHours / 24;
    },
    get totalWorkHours() {
        // Total work hours in the quarter based on selected workdays and hours per day
        const { quarterStartDate, quarterEndDate } = this.quarterInfo;
        const start = new Date(quarterStartDate.getTime());
        let {amountOfWorkDays} = countDaysInQuarter(start, quarterEndDate, this.selectedWorkdays);
        if (this.factorInHolidays && this.holidays.length > 0) {
            amountOfWorkDays -= this.holidays.filter(h => {
                const d = new Date(h.date);
                return d >= quarterStartDate && d < quarterEndDate && this.selectedWorkdays.includes(d.getDay());
            }).length;
        }
        return amountOfWorkDays * this.workhoursPerDay;
    },
    get totalHours() {
        const { quarterStartDate, quarterEndDate } = this.quarterInfo;
        const start = new Date(quarterStartDate.getTime());
        let {totalAmountOfDays} = countDaysInQuarter(start, quarterEndDate, this.selectedWorkdays);
        return totalAmountOfDays * 24;
    },
    get remainingWorkhours() {
        // Calculate the remaining work hours in the quarter
        const { quarterEndDate } = this.quarterInfo;
        const workDaysSet = new Set(this.selectedWorkdays);
        let count = 0;
        let currentDate = new Date(this.now.getTime());
        let currentDay = getAbsoluteDayNumber(currentDate);
        let quarterEndDay = getAbsoluteDayNumber(quarterEndDate);
        while (currentDay < quarterEndDay) {
            // Check if the current day of the week is in our set of workdays.
            if (workDaysSet.has(currentDate.getDay())) {
                // Check if today is a holiday
                let isHoliday = false;
                if (this.factorInHolidays && this.holidays.length > 0) {
                    isHoliday = this.holidays.some(h => h.date === currentDate.toISOString().slice(0, 10));
                }
                if (!isHoliday) {
                    count+= this.workhoursPerDay;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
            currentDay++;
        }
        if (workDaysSet.has(currentDate.getDay())) {
            let isHoliday = false;
            if (this.factorInHolidays && this.holidays.length > 0) {
                isHoliday = this.holidays.some(h => h.date === currentDate.toISOString().slice(0, 10));
            }
            if (!isHoliday) {
                const modifier = 24 / this.workhoursPerDay;
                const remainingTime = (24 - currentDate.getHours() - currentDate.getMinutes() / 60) / modifier;
                count += remainingTime;
            }
        }
        return count;
    },
    get remainingHours() {
        // Calculate the remaining work hours in the quarter
        const { quarterEndDate } = this.quarterInfo;
        let count = 0;
        let currentDate = new Date(this.now.getTime());
        let currentDay = getAbsoluteDayNumber(currentDate);
        let quarterEndDay = getAbsoluteDayNumber(quarterEndDate);
        while (currentDay < quarterEndDay) {
            count+= 24;
            currentDate.setDate(currentDate.getDate() + 1);
            currentDay++;
        }
        const remainingTime = (24 - currentDate.getHours() - currentDate.getMinutes() / 60);
        count += remainingTime;
        return count;
    },
    get remainingWorkPercent() {
        // Percentage of remaining workhours in the quarter
        return Math.round((this.remainingWorkhours / this.totalWorkHours) * 100);
    },
    get remainingPercent() {
        // Percentage of remaining workhours in the quarter
        return Math.round((this.remainingHours / this.totalHours) * 100);
    },
    setFactorInHolidays() {
        this.saveSettings();
    },
    // Watchers to save settings when they change
    async setSelectedCountry() {
        this.saveSettings();
        if (this.factorInHolidays) {
            await this.fetchHolidays();
        }
    },
    setSelectedWorkdays() {
        this.saveSettings();
    },
    setWorkhoursPerDay() {
        if (this.workhoursPerDay < 1) {
            this.workhoursPerDay = 1; // Ensure at least 1 hour per day
        }
        if (this.workhoursPerDay > 24) {
            this.workhoursPerDay = 24; // Cap at 24 hours per day
        }
        this.saveSettings();
    },
}));



Alpine.start()
