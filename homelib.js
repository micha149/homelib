var path = process.env.COVERAGE
  ? './src-cov/'
  : './src/';
  
module.exports = {
    GroupAddress: require(path + 'GroupAddress.js'),
    Datapoint: require(path + 'Datapoint.js')
};