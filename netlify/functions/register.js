exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: "Netlify function is working"
    })
  };
};
