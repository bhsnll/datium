interface ITheme {
    primary:string;
    primary_text:string;
    secondary:string;
    secondary_text:string;
    secondary_accent:string;
}

interface IOptions {
    displayAs:string;
    minDate:Date;
    maxDate:Date;
    defaultDate:Date;
    theme:ITheme;
    militaryTime:boolean;
    isSecondValid:(date:Date) => boolean;
    isMinuteValid:(date:Date) => boolean;
    isHourValid:(date:Date) => boolean;
    isDateValid:(date:Date) => boolean;
    isMonthValid:(date:Date) => boolean;
    isYearValid:(date:Date) => boolean;
}