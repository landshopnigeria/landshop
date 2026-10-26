from parsers import parse_csv

def test_csv_import_preview():
    result = parse_csv(b'title,state,price,unexpected\nMerit Mews,Lagos,20000000,blocked\n')
    assert result.rows[0]['title'] == 'Merit Mews'
    assert 'unexpected' in result.rejected_columns

def test_csv_limit():
    try:
        parse_csv(b'x' * 15_000_001)
        assert False, 'limit must fail'
    except ValueError:
        pass
