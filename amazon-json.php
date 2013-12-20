<?php

class Amazon
{

    /**
     * アカウント情報
     * @var array アフィリエイト登録情報の連想配列
     */
    protected $account;

    /**
     * コンストラクタ
     * @param array $account アフィリエイト登録情報の連想配列
     */
    public function __construct($account)
    {
        // アフィリエイト登録情報の設定
        $this->account = $account;
    }

    /**
     * RFC3986形式のURLエンコード処理
     * @param string $str パラメタ文字列
     * @return string エンコード結果文字列
     */
    private function urlencode_3986($str)
    {
        return str_replace('%7E', '~', rawurlencode($str));
    }

    /**
     * RFC3986形式のクエリ文字列生成
     * @param array $params クエリパラメタの配列
     * @return string RFC3986形式でURLエンコードされた文字列
     */
    private function http_build_query_3986($params)
    {
        $ret = "";
        foreach ($params as $k => $v) {
            $ret .= '&' . $this->urlencode_3986($k) . '=' . $this->urlencode_3986($v);
        }
        $ret = substr($ret, 1);
        return $ret;
    }

    // Amazon API 署名生成
    private function getAmazonSignature($baseurl, $querystring)
    {
        $parsedurl = parse_url($baseurl);
        $signdata = "GET\n" . $parsedurl["host"] . "\n" . $parsedurl["path"] . "\n" . $querystring;
        return base64_encode(hash_hmac("sha256", $signdata, $this->account["SecretAccessKeyId"], true));
    }

    /**
     * 商品検索クエリ生成
     * @link http://docs.amazonwebservices.com/AWSECommerceService/latest/DG/Welcome.html
     * @return string RESTクエリ文字列
     */
    private function queryItems($SearchIndex, $Keywords)
    {
        // クエリ生成
        $baseurl = "http://ecs.amazonaws.jp/onca/xml";
        $params = array();
        $params["Service"] = "AWSECommerceService";
        $params["AWSAccessKeyId"] = $this->account["AccessKeyId"];
        $params["AssociateTag"] = $this->account["AssociateTag"];
        $params["Version"] = "2011-08-01";
        $params["Operation"] = "ItemSearch";
        $params["SearchIndex"] = $SearchIndex;
        $params["Keywords"] = $Keywords;
        $params["ResponseGroup"] = "Medium,OfferSummary,Reviews";
        $params["Timestamp"] = gmdate("Y-m-d\TH:i:s\Z");
        ksort($params);
        $signed_query = $this->http_build_query_3986($params);
        $signed_query .= '&Signature=' . $this->urlencode_3986($this->getAmazonSignature($baseurl, $signed_query));
        $signed_query_url = $baseurl . '?' . $signed_query;
        return $signed_query_url;
    }

    /**
     * 商品検索
     * @link http://docs.amazonwebservices.com/AWSECommerceService/latest/DG/Welcome.html
     * @return array 商品情報の連想配列
     */
    public function getItems($s, $k)
    {

        // SearchIndex 指定有無の判定
        if (empty($s)) {

            // SearchIndex が All の場合は Keywords のみ指定可能
            $ss = "All";
            if (!empty($k)) {
                $kk = $k;
            } else {$kk = "amazon";}
        } else {

            // SearchIndexを設定
            $ss = $s;
            if (!empty($k)) {
                $kk = $k;
            } else {$kk = "amazon";}
        }

        // RESTクエリ情報を取得
        $queries = $this->queryItems($ss, $kk);
        $response = @file_get_contents($queries);

    if ($response === False)
    {
        return False;
    }
    else
    {
        // parse XML
        $pxml = simplexml_load_string($response);
        if ($pxml === False)
        {
            return False; // no xml
        }
        else
        {
            return $pxml;
        }
    }
    }
}

define("ACCESS_KEY_ID", 'ACCESS_KEY_ID');
define("SECRET_ACCESS_KEY", 'SECRET_ACCESS_KEY');
define("ASSOCIATE_TAG", 'tadashi05-22');

$keywords = $_GET['keywords'];
$search_index = $_GET['search_index'];


switch ($search_index) {
    case "All":
        $search_i = "All";
        break;
    case "Apparel":
        $search_i = "Apparel";
        break;
    case "Automotive":
        $search_i = "Automotive";
        break;
    case "Baby":
        $search_i = "Baby";
        break;
    case "Beauty":
        $search_i = "Beauty";
        break;
    case "Books":
        $search_i = "Books";
        break;
    case "Electronics":
        $search_i = "Electronics";
        break;
    case "ForeignBooks":
        $search_i = "ForeignBooks";
        break;
    case "Grocery":
        $search_i = "Grocery";
        break;
    case "HealthPersonalCare":
        $search_i = "HealthPersonalCare";
        break;
    case "Hobbies":
        $search_i = "Hobbies";
        break;
    case "HomeImprovement":
        $search_i = "HomeImprovement";
        break;
    case "Jewelry":
        $search_i = "Jewelry";
        break;
    case "Kitchen":
        $search_i = "Kitchen";
        break;
    case "Music":
        $search_i = "Music";
        break;
    case "Shoes":
        $search_i = "Shoes";
        break;
    case "Software":
        $search_i = "Software";
        break;
    case "VHS":
        $search_i = "VHS";
        break;
    case "Video":
        $search_i = "Video";
        break;
    case "VideoGames":
        $search_i = "VideoGames";
        break;
    case "Watches":
        $search_i = "Watches";
        break;
    default:
        $search_i = "All";
        break;
}


$service = new Amazon(array(
           "AccessKeyId" => ACCESS_KEY_ID,
           "SecretAccessKeyId" => SECRET_ACCESS_KEY,
           "AssociateTag" => ASSOCIATE_TAG
            ));

$pxml = $service->getItems($search_i,$keywords);

// echo $pxml;
header("Content-Type: application/json; charset=utf-8");

if ($pxml === false)
{
    $response = json_encode(array("result" => "failed"));
    echo $response;
} else {

    if (isset($pxml->Items))
    {
        $response = json_encode(array("result" => $pxml->Items));
        echo $response;
    }
}
