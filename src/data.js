let milestones;
try {
  milestones = require('../milestones.json');
} catch (_) { }

let data;
if (milestones) {
  data = milestones
    .map(d => ({
      id: d._id,
      title: d.title,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      editable: !d.delivery.readyDate,
    }))
    .sort((a,b) => a.startDate - b.startDate)
    .map((d,i) => ({
      ...d,
      index: i,
    }));
} else {
  data = [
    {
      "id": "5ac43b0b8d99930022d82573",
      "title": "Scoping & M1 Review",
      "startDate": "2018-04-04T02:40:18.174Z",
      "endDate": "2018-05-28T16:00:00.000Z",
      "editable": false,
      "index": 0
    },
    {
      "id": "5ac690581f26bd002207cea2",
      "title": "Design",
      "startDate": "2018-05-28T16:00:00.000Z",
      "endDate": "2018-06-17T16:00:00.000Z",
      "editable": false,
      "index": 1
    },
    {
      "id": "5ac6905f0b378000224f369d",
      "title": "Design & Development 1/2",
      "startDate": "2018-06-17T16:00:00.000Z",
      "endDate": "2018-06-28T16:00:00.000Z",
      "editable": false,
      "index": 2
    },
    {
      "id": "5ac690661f26bd002207ced0",
      "title": "Design & Development 2/2",
      "startDate": "2018-06-28T16:00:00.000Z",
      "endDate": "2018-07-20T16:00:00.000Z",
      "editable": true,
      "index": 3
    },
    {
      "id": "5ac6906c7f8c05001c676591",
      "title": "Development & Documentation ",
      "startDate": "2018-07-20T16:00:00.000Z",
      "endDate": "2018-07-29T16:00:00.000Z",
      "editable": true,
      "index": 4
    }
  ].map(d => ({
    ...d,
    startDate: new Date(d.startDate),
    endDate: new Date(d.endDate),
  }))
}

export default data;
