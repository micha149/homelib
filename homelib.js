var path = process.env.COVERAGE
  ? __dirname + '/src-cov/'
  : __dirname +  '/src/';

module.exports = {
    GroupAddress: require(path + 'GroupAddress'),
    PhysicalAddress: require(path + 'PhysicalAddress'),
    Datapoint: require(path + 'Datapoint'),
    Driver: require(path + 'Driver'),
    Error:  require(path + 'Error'),
    Message: require(path + 'Message'),
    Connection: require(path + 'Connection'),
    Timer: require(path + 'Timer'),
    assert: require(path + "assert")
};