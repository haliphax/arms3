"ARMS/3 entry point"

# stdlib
from imp import find_module, load_module
from os import listdir, remove
from os.path import isfile, getmtime, join
from time import time
# 3rd party
import click
# local
from . import app, root


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
            remove(fname)
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
