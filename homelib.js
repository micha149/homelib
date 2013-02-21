var path = process.env.COVERAGE
  ? __dirname + '/src-cov/'
  : __dirname +  '/src/';

module.exports = {
    GroupAddress: require(path + 'GroupAddress.js'),
    PhysicalAddress: require(path + 'PhysicalAddress.js'),
    Datapoint: require(path + 'Datapoint.js'),
    Message: require(path + 'Message.js')
};