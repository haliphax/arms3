"ARMS/3 entry point"

# stdlib
from imp import find_module, load_module
import json
from os import listdir, remove as delete
from os.path import isfile, getmtime, join
from time import time
# 3rd party
import click
# local
from . import app, get_agent, root


def _agent_filename(id):
    "Get filename for given agent ID"

    return join(root, 'agents', '{}.json'.format(id))


@click.group()
def cli():
    "Command line interface group"


@cli.command()
def clean():
    "Clean up old reports"

    print('Cleaning up old reports')
    files = [f for f in listdir(join(root, 'reports'))
             if isfile(join(root, 'reports', f)) and f.endswith('.json')]
    now = time()

    for f in files:
        fname = join(root, 'reports', f)
        mtime = getmtime(fname)

        # 2 days
        if now - mtime >= 86400 * 2:
            delete(fname)
            print('Deleted {}'.format(fname))


@cli.command()
@click.argument('id')
def get(id):
    'Get agent information given character ID'

    agent = get_agent(id)

    if agent is None:
        print('Agent file does not exist')

        return

    print(agent)


@cli.command()
@click.argument('id')
@click.argument('key')
def create(id, key):
    'Create agent file with given character ID and auth key'

    id = int(id)
    fname = _agent_filename(id)

    if isfile(fname):
        print('Agent file already exists')

        return

    agent = {'id': id, 'key': key}

    with open(fname, 'w') as f:
        f.write(json.dumps(agent))

    print('Created {}'.format(fname))


@cli.command()
@click.argument('id')
def remove(id):
    'Remove agent file with given ID'

    fname = _agent_filename(id)

    if not isfile(fname):
        print('Agent file does not exist')

        return

    delete(fname)
    print('Deleted {}'.format(fname))


@cli.command()
def start():
    "Start the WSGI server"

    host = '0.0.0.0'
    port = 48164
    found = find_module('config', [root])

    if found:
        print('Using custom configuration')
        config = load_module('config', *found)

        if hasattr(config, 'host'):
            host = config.host

        if hasattr(config, 'port'):
            port = config.port
    else:
        print('Using default configuration')

    app.run(host=host, port=port)


if __name__ == '__main__':
    cli()
