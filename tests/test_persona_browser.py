"""Browser regression of the built site: four teams x three access levels.
Run after materialization and serving _site: python tests/test_persona_browser.py
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:8765')
parser.add_argument('--output', default='test-results/personas')
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
titles = {'executive':'Executive Intelligence Hub', 'strategy':'Strategy Command Center', 'maci':'Research & Customer Intelligence Center', 'operations':'Product & Operations Command Center'}
results = []
errors = []
with sync_playwright() as p:
    exe = os.environ.get('CHROMIUM_EXECUTABLE')
    browser = p.chromium.launch(headless=True, **({'executable_path':exe, 'args':['--no-sandbox']} if exe else {}))
    page = browser.new_page(viewport={'width':1440, 'height':1000}, accept_downloads=True)
    page.set_default_timeout(15000)
    page.on('pageerror', lambda err: errors.append(str(err)))
    def choose(team, role, change=True):
        if change:
            page.locator('#qChangeWorkspace').click()
        page.locator(f'#teamScreen [data-team="{team}"]').click()
        page.locator('#qTeamContinue').click()
        page.locator(f'#roleScreen [data-role="{role}"]').click()
        page.locator('#enterHub').click()
        expect(page.locator('.view.active')).to_have_attribute('data-view', 'team-dashboard')
        if team == 'maci':
            expect(page.locator('.view.active .qm-center')).to_be_visible()
        else:
            expect(page.locator('.view.active h1')).to_have_text(titles[team])
    def go(route):
        page.locator(f'.nav-item[data-view="{route}"]').click()
        expect(page.locator('.view.active')).to_have_attribute('data-view', route)
    try:
        page.goto(args.url, wait_until='domcontentloaded')
        page.locator('#username').fill('quest@medtech.com')
        page.locator('#password').fill('evalueserve')
        page.locator('#loginForm button[type=submit]').click()
        expect(page.locator('#teamScreen')).to_be_visible()
        for team in titles:
            for role in ['Hub Owner', 'Contributor', 'Viewer']:
                choose(team, role, change=bool(results))
                if team != 'maci':
                    page.locator('[data-qp-tab]').first.focus()
                    page.keyboard.press('End')
                    expect(page.locator('[data-qp-tab]').last).to_have_attribute('aria-selected', 'true')
                    page.keyboard.press('Home')
                if role == 'Hub Owner':
                    page.screenshot(path=str(out / f'{team}-hub.png'), full_page=True)
                go('reports')
                with page.expect_download() as event:
                    page.locator('.view.active [data-report="0"]').click()
                target = out / f'{team}-{role.replace(" ", "-")}.html'
                event.value.save_as(str(target))
                assert 'Evidence limitations' in target.read_text()
                go('copilot')
                expect(page.locator('#qTeamPromptInput')).to_be_visible()
                page.locator('#qTeamPromptInput').fill('What evidence supports interoperability across all relevant studies?')
                page.locator('#qTeamPromptForm button[type=submit]').click()
                expect(page.locator('#qTeamAnswer')).to_be_visible()
                expect(page.locator('#qTeamAnswer')).to_contain_text('Sources' if team == 'maci' else 'Traceability')
                answer = page.locator('#qTeamAnswer').inner_text()
                assert 'sample-weighted mean' not in answer.lower()
                assert ('Research answer' in answer if team == 'maci' else 'No approved Quest customer finding' in answer)
                go('decisions')
                draft = page.locator('.view.active [data-qp-action="new"]')
                review = page.locator('.view.active [data-qp-action="review"]').first
                expect(draft).to_be_disabled() if role == 'Viewer' else expect(draft).to_be_enabled()
                expect(review).to_be_enabled() if role == 'Hub Owner' else expect(review).to_be_disabled()
                if team == 'operations':
                    assert page.evaluate("QuestWorkspaces.go('news')") is False
                    values = page.locator('.view.active [data-qp-scope] option').evaluate_all('(nodes)=>nodes.map(n=>n.value)')
                    assert 'consumer-testing' not in values
                results.append({'team':team, 'role':role, 'status':'passed'})
                print('PASS', team, role, flush=True)
        choose('operations', 'Hub Owner')
        go('decisions')
        page.locator('.view.active [data-qp-action="review"]').first.click()
        page.locator('#qpReviewForm [name="stage"]').select_option('Evidence-backed')
        page.locator('#qpReviewForm [name="owner"]').fill('Demo review owner')
        page.locator('#qpReviewForm [name="rationale"]').fill('Review test: no customer evidence supplied.')
        page.locator('#qpReviewForm [type="submit"]').click()
        expect(page.locator('#qpFormError')).to_contain_text('approve applicable customer evidence')
        page.locator('#qpReviewForm [name="stage"]').select_option('Validating')
        page.locator('#qpReviewForm [type="submit"]').click()
        expect(page.locator('#qpDialog')).to_have_count(0)
        expect(page.locator('.view.active')).to_contain_text('Validating')
        go('competitors')
        expect(page.locator('.view.active .qp-role-summary')).to_contain_text('documented scope')
        expect(page.locator('.view.active .qp-legacy-tools')).not_to_have_attribute('open', '')
        go('team-dashboard')
        page.set_viewport_size({'width':390, 'height':844})
        page.wait_for_timeout(300)
        size = page.evaluate('({viewport:innerWidth,document:document.documentElement.scrollWidth})')
        assert size['document'] <= size['viewport'] + 2, size
        page.screenshot(path=str(out / 'operations-mobile.png'), full_page=True)
        page.set_viewport_size({'width':1440, 'height':1000})
        go('copilot')
        page.locator('#qTeamPromptInput').fill('<img src=x onerror="window.personaXss=true"> interoperability')
        page.locator('#qTeamPromptForm button[type=submit]').click()
        expect(page.locator('#qTeamAnswer')).to_contain_text('Traceability')
        assert page.evaluate('window.personaXss===true') is False
        choose('maci', 'Viewer')
        go('copilot')
        expect(page.locator('#qTeamAnswer')).to_be_hidden()
        assert not errors, errors
    except Exception:
        page.screenshot(path=str(out / 'failure.png'), full_page=True)
        (out / 'failure.html').write_text(page.content())
        raise
    finally:
        (out / 'results.json').write_text(json.dumps({'matrix':results, 'page_errors':errors}, indent=2))
        browser.close()
print('PASS all persona browser regressions', flush=True)
