"ARMS/3 server"

# stdlib
import json
from os.path import abspath, dirname, getmtime, isfile, join
# 3rd party
from flask import Flask, g, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)
root = abspath(join(dirname(__file__), '..'))


def login_required(func, *args, **kwargs):
    "Decorator for checking ARMS/3 auth token"

    def wrap(*args, **kwargs):
        if 'X-ARMS3-Key' not in request.headers:
            return 'No auth token', 401

        id, key = request.headers['X-ARMS3-Key'].split(':')
        agent = get_agent(id)
        g.id = int(id)

        if agent is None or key != agent['key']:
            return 'Invalid token', 403

        return func(*args, **kwargs)

    wrap.__name__ = func.__name__

    return wrap


def agent_filename(id):
    "Get filename for given agent ID"

    return join(root, 'agents', '{}.json'.format(id))


def report_filename(xy):
    "Get filename for given report"

    return join(root, 'reports', '{}.json'.format(xy))


def get_agent(id):
    "Pull agent information from file"

    fname = agent_filename(id)

    if not isfile(fname):
        return None

    with open(fname, 'r') as f:
        return json.loads(f.read())


def get_report(xy):
    "Pull report information for given coords from file"

    fname = report_filename(xy)

    if not isfile(fname):
        return None

    with open(fname, 'r') as f:
        r = json.loads(f.read())
        r['when'] = int(getmtime(fname))

        return r


@app.route('/report/<xy>', methods=('GET',))
@login_required
def get(xy):
    "Request report information for surrounding area given coords"

    split = xy.split('-')
    x, y = int(split[0]), int(split[1])
    reports = []

    for i in range(x - 1, x + 2):
        for j in range(y - 1, y + 2):
            report = get_report('{}-{}'.format(i, j))

            if report is not None:
                reports.append(report)

    return jsonify(reports), 200


@app.route('/report', methods=('POST',))
@login_required
def post():
    "Submit report information"

    data = json.loads(request.data.decode('utf-8'))
    data['agent'] = g.id
    coords = data['coords']
    report = get_report(coords)

    if report is not None:
        # don't clobber ruin cost if reporting from outside
        if report['ruin'] > 0 and data['ruin'] == -1:
            del data['ruin']

        report.update(data)
    else:
        report = data

    split = coords.split('-')
    x, y = int(split[0]), int(split[1])

    with open(report_filename('{}-{}'.format(x, y)), 'w') as f:
        f.write(json.dumps(report))

    return get(coords)
