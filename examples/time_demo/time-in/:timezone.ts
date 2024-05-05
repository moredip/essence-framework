export default function get({pathParams}){
    const timeZone = pathParams.timezone

    const time = new Date();
    const formattedTime = time.toLocaleString('en-US',{timeZone});

    return `the time in ${timeZone} is
    ${formattedTime}
    `
}