// Simple test function for DigitalOcean
function main(args) {
	console.log('Test function called with args:', args);
	return {
		statusCode: 200,
		body: {
			success: true,
			message: 'Test function working',
			args: args
		}
	};
}

exports.main = main;
