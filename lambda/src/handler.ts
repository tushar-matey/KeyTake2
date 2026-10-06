// eslint-disable-next-line @typescript-eslint/no-explicit-any -- placeholder handler
export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  return { statusCode: 200 };
};
