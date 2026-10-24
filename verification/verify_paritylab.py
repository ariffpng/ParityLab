"""
ParityLab - independent verification (report Appendix A, extended).

A SEPARATE implementation of the parity chain using Python's decimal.Decimal
(precision 28). It does not import or share any code with the TypeScript engine.

It:
  1. recomputes scenarios A-F and the unequal-real-rate diagnostic,
  2. asserts the published reference values (project report Section 3),
  3. writes verification/expected_values.json, which the Vitest test
     app/src/lib/__tests__/crosscheck.test.ts compares against the TypeScript
     engine with tolerance 1e-9.

Usage (from the project root):
    python verification/verify_paritylab.py
    python verification/verify_paritylab.py --log logs/python_verification_output.txt

Output is ASCII-only so it survives any Windows console code page.
"""

import argparse
import json
import platform
import sys
from datetime import datetime, timezone
from decimal import ROUND_DOWN, Decimal, getcontext
from pathlib import Path

getcontext().prec = 28
D = Decimal

SPOT = D("4.4")
R = D("0.015")
HUNDRED = D(100)

SCENARIOS = {
    "A_baseline": (D("0.025"), D("0.030")),
    "B_US_spike": (D("0.025"), D("0.050")),
    "C_equal": (D("0.025"), D("0.025")),
    "D_MY_higher": (D("0.050"), D("0.025")),
    "E_extreme_MY": (D("0.080"), D("0.010")),
    "F_extreme_US": (D("0.010"), D("0.080")),
}

# Published reference values, project report Section 3.
# (field, expected value, decimal places) - compared after rounding to that many places.
# Values printed in the report with a trailing ellipsis are checked separately by truncation
# (see TRUNCATED_REFERENCE).
REFERENCE = {
    "A_baseline": [
        ("i_my_pct", "4.0375", 4), ("i_us_pct", "4.5450", 4), ("diff_pp", "-0.5075", 4),
        ("ppp_spot", "4.3786407767", 10), ("cip_forward", "4.3786407767", 10),
        ("quote_change_pct", "-0.4854368932", 10), ("myr_value_change_pct", "0.4878048780", 10),
    ],
    "B_US_spike": [
        ("i_my_pct", "4.0375", 4), ("i_us_pct", "6.5750", 4), ("diff_pp", "-2.5375", 4),
        ("ppp_spot", "4.2952380952", 10), ("cip_forward", "4.2952380952", 10),
        ("quote_change_pct", "-2.3809523810", 10), ("myr_value_change_pct", "2.4390243902", 10),
    ],
    "C_equal": [
        ("i_my_pct", "4.0375", 4), ("i_us_pct", "4.0375", 4), ("diff_pp", "0.0000", 4),
        ("ppp_spot", "4.4000", 4), ("cip_forward", "4.4000", 4),
        ("quote_change_pct", "0.0000", 4), ("myr_value_change_pct", "0.0000", 4),
    ],
    "D_MY_higher": [
        ("i_my_pct", "6.5750", 4), ("i_us_pct", "4.0375", 4), ("diff_pp", "2.5375", 4),
        ("ppp_spot", "4.5073", 4), ("cip_forward", "4.5073", 4),
        ("quote_change_pct", "2.4390", 4), ("myr_value_change_pct", "-2.3810", 4),
    ],
    "E_extreme_MY": [
        ("i_my_pct", "9.6200", 4), ("i_us_pct", "2.5150", 4), ("diff_pp", "7.1050", 4),
        ("ppp_spot", "4.7050", 4), ("cip_forward", "4.7050", 4),
        ("quote_change_pct", "6.9307", 4), ("myr_value_change_pct", "-6.4815", 4),
    ],
    "F_extreme_US": [
        ("i_my_pct", "2.5150", 4), ("i_us_pct", "9.6200", 4), ("diff_pp", "-7.1050", 4),
        ("ppp_spot", "4.1148", 4), ("cip_forward", "4.1148", 4),
        ("quote_change_pct", "-6.4815", 4), ("myr_value_change_pct", "6.9307", 4),
    ],
}

# The report prints these as "4.50731707...", i.e. truncated digits.
TRUNCATED_REFERENCE = {
    "D_MY_higher": ("ppp_spot", "4.50731707"),
    "E_extreme_MY": ("ppp_spot", "4.70495049"),
    "F_extreme_US": ("ppp_spot", "4.11481481"),
}

EXPECTED_DIRECTION = {
    "A_baseline": "appreciates",
    "B_US_spike": "appreciates",
    "C_equal": "unchanged",
    "D_MY_higher": "depreciates",
    "E_extreme_MY": "depreciates",
    "F_extreme_US": "appreciates",
}


def q(value, places):
    """Round a Decimal to `places` dp (ROUND_HALF_EVEN is fine for a comparison at that precision)."""
    return value.quantize(D(1).scaleb(-places))


def trunc(value, places):
    """Truncate a Decimal to `places` dp."""
    return value.quantize(D(1).scaleb(-places), rounding=ROUND_DOWN)


def direction(pi_my, pi_us):
    d = pi_my - pi_us
    if d < 0:
        return "appreciates"
    if d > 0:
        return "depreciates"
    return "unchanged"


def compute(pi_my, pi_us, r_my, r_us, spot):
    i_my = (1 + r_my) * (1 + pi_my) - 1
    i_us = (1 + r_us) * (1 + pi_us) - 1
    s_ppp = spot * (1 + pi_my) / (1 + pi_us)
    f_cip = spot * (1 + i_my) / (1 + i_us)
    return {
        "pi_my": pi_my,
        "pi_us": pi_us,
        "r_my": r_my,
        "r_us": r_us,
        "spot": spot,
        "i_my_pct": i_my * HUNDRED,
        "i_us_pct": i_us * HUNDRED,
        "i_my_approx_pct": (r_my + pi_my) * HUNDRED,
        "i_us_approx_pct": (r_us + pi_us) * HUNDRED,
        "diff_pp": (i_my - i_us) * HUNDRED,
        "ppp_spot": s_ppp,
        "cip_forward": f_cip,
        "ife_spot": spot * (1 + i_my) / (1 + i_us),
        "quote_change_pct": (s_ppp / spot - 1) * HUNDRED,
        "quote_change_approx_pct": (pi_my - pi_us) * HUNDRED,
        "myr_value_change_pct": (spot / s_ppp - 1) * HUNDRED,
        "usd_forward_premium_pct": (f_cip / spot - 1) * HUNDRED,
        "real_rate_ratio": (1 + r_my) / (1 + r_us),
        "direction": direction(pi_my, pi_us),
    }


class Log:
    def __init__(self):
        self.lines = []

    def __call__(self, text=""):
        print(text)
        self.lines.append(text)


def main():
    parser = argparse.ArgumentParser(description="Independent Decimal verification of ParityLab.")
    parser.add_argument("--log", help="also write the console output to this file (UTF-8)")
    args = parser.parse_args()

    here = Path(__file__).resolve().parent
    log = Log()
    checks = 0

    log("ParityLab independent verification (Python decimal.Decimal, precision 28)")
    log(f"Run at (UTC): {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"Python {platform.python_version()} on {platform.system()} {platform.release()}")
    log("Spot S0 = 4.4 MYR/USD; common real rate r = 1.5%. All values are hypothetical teaching assumptions.")
    log("")

    results = {}
    for name, (pi_my, pi_us) in SCENARIOS.items():
        res = compute(pi_my, pi_us, R, R, SPOT)
        results[name] = res

        # Appendix A assertion: PPP and CIP coincide under a common real rate.
        assert abs(res["ppp_spot"] - res["cip_forward"]) < D("1e-20"), name
        checks += 1
        for field, expected, places in REFERENCE[name]:
            got = q(res[field], places)
            assert got == D(expected), f"{name}.{field}: got {got}, expected {expected}"
            checks += 1
        if name in TRUNCATED_REFERENCE:
            field, expected = TRUNCATED_REFERENCE[name]
            got = trunc(res[field], 8)
            assert got == D(expected), f"{name}.{field}: got {got}..., expected {expected}..."
            checks += 1
        assert res["direction"] == EXPECTED_DIRECTION[name], name
        checks += 1

        log(
            f"{name:<13} MY nominal={res['i_my_pct']:.4f}%  US nominal={res['i_us_pct']:.4f}%  "
            f"diff={res['diff_pp']:+.4f} pp"
        )
        log(
            f"{'':<13} PPP={res['ppp_spot']:.10f}  CIP={res['cip_forward']:.10f} MYR/USD  "
            f"quote chg={res['quote_change_pct']:+.10f}%  MYR value chg={res['myr_value_change_pct']:+.10f}%  "
            f"MYR {res['direction']}"
        )

    # Advanced unequal-real-rate diagnostic.
    adv = compute(D("0.025"), D("0.030"), D("0.015"), D("0.025"), SPOT)
    results["ADV_unequal_real"] = adv
    assert abs(adv["ppp_spot"] - adv["cip_forward"]) > D("0.04")
    assert q(adv["i_us_pct"], 4) == D("5.5750")
    assert q(adv["ppp_spot"], 10) == D("4.3786407767")
    assert q(adv["cip_forward"], 10) == D("4.3359223301")
    assert q(adv["ppp_spot"] - adv["cip_forward"], 4) == D("0.0427")
    assert abs(adv["cip_forward"] / adv["ppp_spot"] - D("1.015") / D("1.025")) < D("1e-25")
    checks += 6
    log("")
    log(
        f"Unequal-real-rate diagnostic (r_MY 1.5%, r_US 2.5%): i_US={adv['i_us_pct']:.4f}%  "
        f"PPP={adv['ppp_spot']:.10f}  CIP={adv['cip_forward']:.10f} MYR/USD  "
        f"gap={adv['ppp_spot'] - adv['cip_forward']:.10f}  F/S_PPP={adv['real_rate_ratio']:.10f} (=1.015/1.025)"
    )

    # Approximation checks (Scenario B quote change; Scenario A Fisher).
    b = results["B_US_spike"]
    overstatement = b["quote_change_approx_pct"] - b["quote_change_pct"]
    assert q(b["quote_change_approx_pct"], 4) == D("-2.5000")
    assert q(overstatement, 4) == D("-0.1190")
    a = results["A_baseline"]
    assert q(a["i_my_approx_pct"], 4) == D("4.0000")
    checks += 3
    log("")
    log(
        f"Approximation check (B): approx quote chg={b['quote_change_approx_pct']:.4f}% vs exact "
        f"{b['quote_change_pct']:.4f}% -> approx overstates the fall by {abs(overstatement):.4f} pp"
    )
    log(f"Approximation check (A): Fisher approx {a['i_my_approx_pct']:.4f}% vs exact {a['i_my_pct']:.4f}%")

    # Sensitivity: di/dpi = 1 + r; +1 pp inflation -> +1.015 pp nominal rate at r = 1.5%.
    bumped = (1 + R) * (1 + D("0.035")) - 1
    base = (1 + R) * (1 + D("0.025")) - 1
    sensitivity_pp = (bumped - base) * HUNDRED
    assert sensitivity_pp == D("1.015")
    checks += 1
    log(f"Sensitivity: +1 pp expected inflation -> +{sensitivity_pp} pp Fisher-implied nominal rate (r = 1.5%)")

    out = {
        "_note": "Generated by verification/verify_paritylab.py using decimal.Decimal (prec 28). "
        "Values are strings to preserve precision. Hypothetical teaching assumptions, not market data.",
        "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "scenarios": {
            name: {k: (v if isinstance(v, str) else str(v)) for k, v in res.items()}
            for name, res in results.items()
        },
        "approximation": {
            "B_quote_change_approx_minus_exact_pp": str(overstatement),
            "A_fisher_approx_pct": str(a["i_my_approx_pct"]),
        },
        "sensitivity": {"nominal_pp_per_inflation_pp_at_r_1_5": str(sensitivity_pp)},
    }
    json_path = here / "expected_values.json"
    json_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")

    log("")
    log(f"ALL {checks} CHECKS PASSED")
    log(f"Wrote {json_path.relative_to(here.parent).as_posix()}")

    if args.log:
        log_path = Path(args.log)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text("\n".join(log.lines) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
