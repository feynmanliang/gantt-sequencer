
data = [
  {
    "_id": "5876b67c4323bd1c00f711a1",
    "startDate": "2017-01-17T19:09:55.951Z",
    "endDate": "2017-01-31T12:00:00.951Z",
    "index": 0
  },
  {
    "_id": "587e6c14f79ff72e00262dcf",
    "startDate": "2017-01-31T12:00:00.951Z",
    "endDate": "2017-02-14T12:00:00.951Z",
    "index": 1
  },
  {
    "_id": "587e6c14f79ff72e00262dd0",
    "startDate": "2017-02-14T12:00:00.951Z",
    "endDate": "2017-02-28T12:00:00.951Z",
    "index": 2
  },
  {
    "_id": "587e6c14f79ff72e00262dd1",
    "startDate": "2017-02-28T12:00:00.951Z",
    "endDate": "2017-03-14T12:00:00.951Z",
    "index": 3
  },
  {
    "_id": "587e6c14f79ff72e00262dd2",
    "startDate": "2017-03-14T12:00:00.951Z",
    "endDate": "2017-03-21T12:00:00.951Z",
    "index": 4
  }
];

data = data
  .map(d => ({
    id: d._id,
    startDate: new Date(d.startDate),
    endDate: new Date(d.endDate),
  }))
  .sort((a,b) => a.startDate - b.startDate)
  .map((d,i) => ({
    ...d,
    index: i,
  }))

console.log(data);
