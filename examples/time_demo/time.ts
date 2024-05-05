export default function (){
    const time = new Date();
    const formattedTime = time.toLocaleString();
    return `the time is ${formattedTime}`
}