from decimal import Decimal
import unittest
from mortgage import calculate_mortgage

class MortgageTests(unittest.TestCase):
    def test_zero_rate(self):
        x=calculate_mortgage("1000000", "250000", "0", 12)
        self.assertEqual(Decimal(x["principal"]), Decimal("750000.00"))
        self.assertEqual(Decimal(x["total_interest"]), Decimal("0.00"))
        self.assertEqual(Decimal(x["schedule"][-1]["balance"]), Decimal("0.00"))
    def test_amortization_and_final_rounding(self):
        x=calculate_mortgage("15000000", "3000000", "12", 180)
        p=sum(Decimal(row["principal"]) for row in x["schedule"])
        self.assertEqual(p, Decimal("12000000.00"))
        self.assertEqual(Decimal(x["schedule"][-1]["balance"]), Decimal("0.00"))
        self.assertGreater(Decimal(x["total_interest"]), Decimal("0"))
    def test_invalid(self):
        cases=[(-1,0,5,12),(100,100,5,12),(100,20,-1,12),(100,20,4,0),(100,20,4,601)]
        for case in cases:
            with self.assertRaises(ValueError): calculate_mortgage(*case)

if __name__=="__main__": unittest.main()
