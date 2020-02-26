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


@app.route('/report/<tl>/<br>', methods=('GET',))
@login_required
def get(tl, br):
    "Request report information for surrounding area given coords"

    split = tl.split('-')
    top_left = [int(split[0]), int(split[1])]
    split = br.split('-')
    bottom_right = [int(split[0]), int(split[1])]
    reports = []

    for i in range(top_left[0], bottom_right[0] + 1):
        for j in range(top_left[1], bottom_right[1] + 1):
            report = get_report('{}-{}'.format(i, j))

            if report is not None:
                reports.append(report)

    return jsonify(reports), 200


@app.route('/report', methods=('POST',))
@login_required
def post():
    "Submit report information"

    data = json.loads(request.data.decode('utf-8'))
    tl = [None, None]
    br = [None, None]

    for d in data['reports']:
        d['agent'] = g.id
        coords = d['coords']
        report = get_report(coords)

        if report is not None:
            # don't clobber ruin cost if reporting from outside
            if ('ruin' in d and 'ruin' in report and report['ruin'] > 0
                    and d['ruin'] == -1):
                del d['ruin']

            if 'genny' in d and 'genny' in report and d['genny'] == '?':
                # don't clobber genny fuel status if reporting from outside
                del d['genny']
            elif data['inside'] and 'genny' not in d and 'genny' in report:
                # erase genny from report if building doesn't have one
                del report['genny']

            report.update(d)
        else:
            report = d

        split = coords.split('-')
        x, y = int(split[0]), int(split[1])

        if tl[0] is None or x < tl[0]:
            tl[0] = x

        if tl[1] is None or y < tl[1]:
            tl[1] = y

        if br[0] is None or x > br[0]:
            br[0] = x

        if br[1] is None or y > br[1]:
            br[1] = y

        with open(report_filename('{}-{}'.format(x, y)), 'w') as f:
            f.write(json.dumps(report))

    if tl[0] == br[0] and tl[1] == br[1]:
        tl[0] -= 1
        tl[1] -= 1
        br[0] += 1
        br[1] += 1

    return get('{}-{}'.format(*tl), '{}-{}'.format(*br))
