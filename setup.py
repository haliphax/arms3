"arms3 installer"

from os.path import realpath, dirname, join
from setuptools import setup

if __name__ == '__main__':
    extra_packages = []
    _reqs = []
    _extras = {}
    abspath = realpath(dirname(__file__))

    with open(join(abspath, 'requirements.txt')) as reqfile:
        _reqs = reqfile.readlines()

    for extra in extra_packages:
        filename = 'requirements_{extra}.txt'.format(extra=extra)

        with open(join(abspath, filename)) as reqfile:
            _extras[extra] = reqfile.readlines()

    setup(
        name='ARMS/3',
        version='0.0.1a1',
        description='Automated Reconnaissance Mission System Mk. III',
        url='https://git.oddnetwork.org/haliphax/arms3',
        author='haliphax',
        license='MIT',
        packages=['arms3'],
        install_requires=_reqs,
        extras_require=_extras
    )
