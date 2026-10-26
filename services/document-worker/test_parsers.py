import unittest
from parsers import parse_csv

class ParserTests(unittest.TestCase):
    def test_csv_import_preview(self):
        result = parse_csv(b'title,state,price,unexpected\nMerit Mews,Lagos,20000000,blocked\n')
        self.assertEqual(result.rows[0]['title'], 'Merit Mews')
        self.assertIn('unexpected', result.rejected_columns)

    def test_csv_limit(self):
        with self.assertRaises(ValueError):
            parse_csv(b'x' * 15_000_001)

if __name__ == '__main__':
    unittest.main()
