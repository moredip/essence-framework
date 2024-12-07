export default function get({ pathParams }: any) {
  const timeZone = pathParams.timezone;

  const time = new Date();
  return {
    timeZone,
    currentTime: time.toISOString(),
  };
}
