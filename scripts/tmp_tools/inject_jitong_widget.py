# -*- coding: utf-8 -*-
import glob

target_pages = [
    'data_atoms.html',
    'data_analysis.html',
    'curriculum_1105_workflow.html',
    'student_data_analyst_workflow.html',
    'estat_catalog_and_research_guide.html',
    'estat_api_tutorial_simulator.html'
]

script_tag = '<script src="js/digital_jitong.js"></script>'

for p in target_pages:
    try:
        with open(p, 'r', encoding='utf-8') as f:
            html = f.read()
        if 'digital_jitong.js' not in html:
            html = html.replace('</body>', f'  {script_tag}\n</body>', 1)
            with open(p, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"Injected 數位乩童 into {p}")
        else:
            print(f"Already injected in {p}")
    except Exception as e:
        print(f"Error updating {p}: {e}")
