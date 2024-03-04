const BUILD_CONIFG = {
	webPath: process.env.NODE_ENV === 'production'
		? '/monopole/'
		: '/',
};

export default BUILD_CONIFG;
