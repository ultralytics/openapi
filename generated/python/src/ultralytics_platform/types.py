from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class APIModel(BaseModel):
    """Base model for API responses."""

    model_config = ConfigDict(populate_by_name=True, protected_namespaces=())


class DatasetsListResponseDatasetsItemSplits(APIModel):
    train: float
    """Training images"""

    val: float
    """Validation images"""

    test: float
    """Test images"""

    labeled: float
    """Labeled images"""


class DatasetsListResponseDatasetsItemSampleImagesItemLabelsItem(APIModel):
    class_id: float = Field(alias="classId")
    """Class index (0-based)"""

    bbox: list[float] | None = Field(default=None)
    """Bounding box [x_center, y_center, width, height] normalized 0-1"""

    segments: list[float] | None = Field(default=None)
    """Segmentation points, normalized 0-1"""

    keypoints: list[float] | None = Field(default=None)
    """Keypoints [x, y, visibility, ...] normalized 0-1"""

    obb: list[float] | None = Field(default=None)
    """Oriented bounding box [x1,y1,x2,y2,x3,y3,x4,y4] normalized 0-1"""

    skeleton_id: str | None = Field(alias="skeletonId", default=None)
    """Skeleton template ID for pose keypoint connections"""


class DatasetsListResponseDatasetsItemSampleImagesItem(APIModel):
    url: str
    """Signed thumbnail URL"""

    image_url: str | None = Field(alias="imageUrl", default=None)
    """Signed full-size image URL used as a thumbnail fallback"""

    width: float
    """Image width in pixels"""

    height: float
    """Image height in pixels"""

    labels: list[DatasetsListResponseDatasetsItemSampleImagesItemLabelsItem] | None = Field(default=None)
    """Preview annotations overlaid on the sample image"""


class DatasetsListResponseDatasetsItemProcessingError(APIModel):
    message: str
    """Client-safe processing failure message"""

    timestamp: datetime
    """When the error occurred"""


class DatasetsListResponseDatasetsItemVersionsItemSplits(APIModel):
    train: float
    """Training images"""

    val: float
    """Validation images"""

    test: float
    """Test images"""

    labeled: float
    """Labeled images"""


class DatasetsListResponseDatasetsItemVersionsItem(APIModel):
    version: float
    """Version number"""

    description: str | None = Field(default=None)
    """User-provided version description"""

    size_bytes: float | None = Field(alias="sizeBytes", default=None)
    """NDJSON file size in bytes"""

    content_hash: str | None = Field(alias="contentHash", default=None)
    """Training-content SHA-256"""

    image_count: float = Field(alias="imageCount")
    """Image count at the time of the snapshot"""

    class_count: float = Field(alias="classCount")
    """Class count at the time of the snapshot"""

    annotation_count: float = Field(alias="annotationCount")
    """Annotation count at the time of the snapshot"""

    splits: DatasetsListResponseDatasetsItemVersionsItemSplits
    """Split stats at the time of the snapshot"""

    created_at: datetime = Field(alias="createdAt")
    """When the version was created"""


class DatasetsListResponseDatasetsItem(APIModel):
    id: str = Field(alias="_id")
    """Dataset ID"""

    username: str
    """Owner's username"""

    slug: str
    """Dataset URL, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset"""

    name: str
    """Display name"""

    description: str | None = Field(default=None)
    """Dataset description"""

    visibility: Literal["public", "private"]
    """Visibility"""

    task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"]
    """YOLO task type"""

    image_count: float = Field(alias="imageCount")
    """Total images"""

    class_count: float | None = Field(alias="classCount", default=None)
    """Number of classes"""

    class_names: list[str] | None = Field(alias="classNames", default=None)
    """Class names"""

    format: Literal["yolo", "coco", "voc", "raw"] | None = Field(default=None)
    """Annotation format"""

    tags: list[str] | None = Field(default=None)
    """Tags"""

    license: (
        Literal[
            "None",
            "CC0-1.0",
            "CC-BY-2.5",
            "CC-BY-4.0",
            "CC-BY-SA-4.0",
            "CC-BY-NC-4.0",
            "CC-BY-NC-SA-4.0",
            "CC-BY-ND-4.0",
            "CC-BY-NC-ND-4.0",
            "Apache-2.0",
            "MIT",
            "AGPL-3.0",
            "GPL-3.0",
            "Research-Only",
            "Other",
        ]
        | None
    ) = Field(default=None)
    """License"""

    splits: DatasetsListResponseDatasetsItemSplits | None = Field(default=None)
    """Split statistics"""

    annotation_count: float | None = Field(alias="annotationCount", default=None)
    """Total annotations"""

    total_bytes: float | None = Field(alias="totalBytes", default=None)
    """Storage size in bytes"""

    star_count: float = Field(alias="starCount")
    """Number of stars"""

    is_starred: bool = Field(alias="isStarred")
    """Whether current user starred this"""

    status: Literal["processing", "ready", "failed"] | None = Field(default=None)
    """Processing status"""

    sample_images: list[DatasetsListResponseDatasetsItemSampleImagesItem] | None = Field(
        alias="sampleImages", default=None
    )
    """Signed sample image previews"""

    storage_provider: Literal["gcs", "s3", "azure"] | None = Field(alias="storageProvider", default=None)
    """Connected storage provider"""

    class_colors: dict[str, str] | None = Field(alias="classColors", default=None)
    """Custom class colors (classId → hex)"""

    kpt_shape: list[Any] | None = Field(alias="kptShape", default=None)
    """Pose keypoint shape [num_keypoints, dims]"""

    flip_idx: list[int] | None = Field(alias="flipIdx", default=None)
    """Pose keypoint horizontal-flip indices"""

    processing_time_ms: float | None = Field(alias="processingTimeMs", default=None)
    """Backend processing time in milliseconds"""

    processing_error: DatasetsListResponseDatasetsItemProcessingError | None = Field(
        alias="processingError", default=None
    )
    """Latest client-safe ingest processing error"""

    error_count: float | None = Field(alias="errorCount", default=None)
    """Number of images with processing errors"""

    icon_color: str | None = Field(alias="iconColor", default=None)
    """Icon background color"""

    icon_letter: str | None = Field(alias="iconLetter", default=None)
    """Icon letter(s)"""

    icon_image: str | None = Field(alias="iconImage", default=None)
    """Signed icon image URL"""

    cloned_from: str | None = Field(alias="clonedFrom", default=None)
    """Source dataset ID if this is a clone"""

    clone_count: float | None = Field(alias="cloneCount", default=None)
    """Number of times this dataset has been cloned"""

    region: Literal["us", "eu", "ap"] | None = Field(default=None)
    """Dataset storage region"""

    versions: list[DatasetsListResponseDatasetsItemVersionsItem] | None = Field(default=None)
    """Saved dataset version snapshots"""

    created_at: datetime = Field(alias="createdAt")
    """Creation timestamp"""

    updated_at: datetime = Field(alias="updatedAt")
    """Last update timestamp"""


class DatasetsListResponse(APIModel):
    datasets: list[DatasetsListResponseDatasetsItem]

    total: float
    """Total matching datasets"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class DatasetsCreateResponse(APIModel):
    project_id: str | None = Field(alias="projectId", default=None)
    """Created project ID"""

    dataset_id: str | None = Field(alias="datasetId", default=None)
    """Created dataset ID"""

    model_id: str | None = Field(alias="modelId", default=None)
    """Created model ID"""

    slug: str
    """Resource name, e.g. `my-dataset`"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class DatasetsRetrieveResponseDatasetSplits(APIModel):
    train: float
    """Training images"""

    val: float
    """Validation images"""

    test: float
    """Test images"""

    labeled: float
    """Labeled images"""


class DatasetsRetrieveResponseDatasetSampleImagesItemLabelsItem(APIModel):
    class_id: float = Field(alias="classId")
    """Class index (0-based)"""

    bbox: list[float] | None = Field(default=None)
    """Bounding box [x_center, y_center, width, height] normalized 0-1"""

    segments: list[float] | None = Field(default=None)
    """Segmentation points, normalized 0-1"""

    keypoints: list[float] | None = Field(default=None)
    """Keypoints [x, y, visibility, ...] normalized 0-1"""

    obb: list[float] | None = Field(default=None)
    """Oriented bounding box [x1,y1,x2,y2,x3,y3,x4,y4] normalized 0-1"""

    skeleton_id: str | None = Field(alias="skeletonId", default=None)
    """Skeleton template ID for pose keypoint connections"""


class DatasetsRetrieveResponseDatasetSampleImagesItem(APIModel):
    url: str
    """Signed thumbnail URL"""

    image_url: str | None = Field(alias="imageUrl", default=None)
    """Signed full-size image URL used as a thumbnail fallback"""

    width: float
    """Image width in pixels"""

    height: float
    """Image height in pixels"""

    labels: list[DatasetsRetrieveResponseDatasetSampleImagesItemLabelsItem] | None = Field(default=None)
    """Preview annotations overlaid on the sample image"""


class DatasetsRetrieveResponseDatasetProcessingError(APIModel):
    message: str
    """Client-safe processing failure message"""

    timestamp: datetime
    """When the error occurred"""


class DatasetsRetrieveResponseDatasetVersionsItemSplits(APIModel):
    train: float
    """Training images"""

    val: float
    """Validation images"""

    test: float
    """Test images"""

    labeled: float
    """Labeled images"""


class DatasetsRetrieveResponseDatasetVersionsItem(APIModel):
    version: float
    """Version number"""

    description: str | None = Field(default=None)
    """User-provided version description"""

    size_bytes: float | None = Field(alias="sizeBytes", default=None)
    """NDJSON file size in bytes"""

    content_hash: str | None = Field(alias="contentHash", default=None)
    """Training-content SHA-256"""

    image_count: float = Field(alias="imageCount")
    """Image count at the time of the snapshot"""

    class_count: float = Field(alias="classCount")
    """Class count at the time of the snapshot"""

    annotation_count: float = Field(alias="annotationCount")
    """Annotation count at the time of the snapshot"""

    splits: DatasetsRetrieveResponseDatasetVersionsItemSplits
    """Split stats at the time of the snapshot"""

    created_at: datetime = Field(alias="createdAt")
    """When the version was created"""


class DatasetsRetrieveResponseDataset(APIModel):
    id: str = Field(alias="_id")
    """Dataset ID"""

    username: str
    """Owner's username"""

    slug: str
    """Dataset URL, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset"""

    name: str
    """Display name"""

    description: str | None = Field(default=None)
    """Dataset description"""

    visibility: Literal["public", "private"]
    """Visibility"""

    task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"]
    """YOLO task type"""

    image_count: float = Field(alias="imageCount")
    """Total images"""

    class_count: float | None = Field(alias="classCount", default=None)
    """Number of classes"""

    class_names: list[str] | None = Field(alias="classNames", default=None)
    """Class names"""

    format: Literal["yolo", "coco", "voc", "raw"] | None = Field(default=None)
    """Annotation format"""

    tags: list[str] | None = Field(default=None)
    """Tags"""

    license: (
        Literal[
            "None",
            "CC0-1.0",
            "CC-BY-2.5",
            "CC-BY-4.0",
            "CC-BY-SA-4.0",
            "CC-BY-NC-4.0",
            "CC-BY-NC-SA-4.0",
            "CC-BY-ND-4.0",
            "CC-BY-NC-ND-4.0",
            "Apache-2.0",
            "MIT",
            "AGPL-3.0",
            "GPL-3.0",
            "Research-Only",
            "Other",
        ]
        | None
    ) = Field(default=None)
    """License"""

    splits: DatasetsRetrieveResponseDatasetSplits | None = Field(default=None)
    """Split statistics"""

    annotation_count: float | None = Field(alias="annotationCount", default=None)
    """Total annotations"""

    total_bytes: float | None = Field(alias="totalBytes", default=None)
    """Storage size in bytes"""

    star_count: float = Field(alias="starCount")
    """Number of stars"""

    is_starred: bool = Field(alias="isStarred")
    """Whether current user starred this"""

    status: Literal["processing", "ready", "failed"] | None = Field(default=None)
    """Processing status"""

    sample_images: list[DatasetsRetrieveResponseDatasetSampleImagesItem] | None = Field(
        alias="sampleImages", default=None
    )
    """Signed sample image previews"""

    storage_provider: Literal["gcs", "s3", "azure"] | None = Field(alias="storageProvider", default=None)
    """Connected storage provider"""

    class_colors: dict[str, str] | None = Field(alias="classColors", default=None)
    """Custom class colors (classId → hex)"""

    kpt_shape: list[Any] | None = Field(alias="kptShape", default=None)
    """Pose keypoint shape [num_keypoints, dims]"""

    flip_idx: list[int] | None = Field(alias="flipIdx", default=None)
    """Pose keypoint horizontal-flip indices"""

    processing_time_ms: float | None = Field(alias="processingTimeMs", default=None)
    """Backend processing time in milliseconds"""

    processing_error: DatasetsRetrieveResponseDatasetProcessingError | None = Field(
        alias="processingError", default=None
    )
    """Latest client-safe ingest processing error"""

    error_count: float | None = Field(alias="errorCount", default=None)
    """Number of images with processing errors"""

    icon_color: str | None = Field(alias="iconColor", default=None)
    """Icon background color"""

    icon_letter: str | None = Field(alias="iconLetter", default=None)
    """Icon letter(s)"""

    icon_image: str | None = Field(alias="iconImage", default=None)
    """Signed icon image URL"""

    cloned_from: str | None = Field(alias="clonedFrom", default=None)
    """Source dataset ID if this is a clone"""

    clone_count: float | None = Field(alias="cloneCount", default=None)
    """Number of times this dataset has been cloned"""

    region: Literal["us", "eu", "ap"] | None = Field(default=None)
    """Dataset storage region"""

    versions: list[DatasetsRetrieveResponseDatasetVersionsItem] | None = Field(default=None)
    """Saved dataset version snapshots"""

    created_at: datetime = Field(alias="createdAt")
    """Creation timestamp"""

    updated_at: datetime = Field(alias="updatedAt")
    """Last update timestamp"""


class DatasetsRetrieveResponse(APIModel):
    dataset: DatasetsRetrieveResponseDataset
    """Dataset detail"""


class DatasetsUpdateResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class DatasetsDeleteResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class DatasetsRetrieveMetadataResponse(APIModel):
    metadata: dict[str, Any]
    """Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters."""

    properties: list[list[Any]]
    """Ultralytics-managed field and value pairs"""


class DatasetsCloneResponse(APIModel):
    dataset_id: str = Field(alias="datasetId")
    """Cloned dataset ID"""

    slug: str
    """Cloned dataset slug"""

    name: str
    """Cloned dataset name"""

    image_count: float = Field(alias="imageCount")
    """Number of images copied into the clone"""

    class_count: float | None = Field(alias="classCount", default=None)
    """Class count on the cloned dataset"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class DatasetsRetrieveClassStatsResponseClassesItem(APIModel):
    class_id: float = Field(alias="classId")

    count: float
    """Total annotations of this class"""

    image_count: float = Field(alias="imageCount")
    """Images containing this class"""


class DatasetsRetrieveClassStatsResponseImageStatsWidthHistogramItem(APIModel):
    bin: float

    count: float

    size: float | None = Field(default=None)
    """Bin width for ranged histograms; 1 for discrete histograms"""


class DatasetsRetrieveClassStatsResponseImageStatsHeightHistogramItem(APIModel):
    bin: float

    count: float

    size: float | None = Field(default=None)
    """Bin width for ranged histograms; 1 for discrete histograms"""


class DatasetsRetrieveClassStatsResponseImageStatsPointsHistogramItem(APIModel):
    bin: float

    count: float

    size: float | None = Field(default=None)
    """Bin width for ranged histograms; 1 for discrete histograms"""


class DatasetsRetrieveClassStatsResponseImageStatsFileSizeHistogramItem(APIModel):
    bin: float

    count: float

    size: float | None = Field(default=None)
    """Bin width for ranged histograms; 1 for discrete histograms"""


class DatasetsRetrieveClassStatsResponseImageStatsObjectsPerImageHistogramItem(APIModel):
    bin: float

    count: float

    size: float | None = Field(default=None)
    """Bin width for ranged histograms; 1 for discrete histograms"""


class DatasetsRetrieveClassStatsResponseImageStatsBboxWidthHistogramItem(APIModel):
    bin: float

    count: float

    size: float | None = Field(default=None)
    """Bin width for ranged histograms; 1 for discrete histograms"""


class DatasetsRetrieveClassStatsResponseImageStatsBboxHeightHistogramItem(APIModel):
    bin: float

    count: float

    size: float | None = Field(default=None)
    """Bin width for ranged histograms; 1 for discrete histograms"""


class DatasetsRetrieveClassStatsResponseImageStatsBboxWidthNormHistogramItem(APIModel):
    bin: float

    count: float

    size: float | None = Field(default=None)
    """Bin width for ranged histograms; 1 for discrete histograms"""


class DatasetsRetrieveClassStatsResponseImageStatsBboxHeightNormHistogramItem(APIModel):
    bin: float

    count: float

    size: float | None = Field(default=None)
    """Bin width for ranged histograms; 1 for discrete histograms"""


class DatasetsRetrieveClassStatsResponseImageStats(APIModel):
    width_histogram: list[DatasetsRetrieveClassStatsResponseImageStatsWidthHistogramItem] = Field(
        alias="widthHistogram"
    )

    height_histogram: list[DatasetsRetrieveClassStatsResponseImageStatsHeightHistogramItem] = Field(
        alias="heightHistogram"
    )

    points_histogram: list[DatasetsRetrieveClassStatsResponseImageStatsPointsHistogramItem] = Field(
        alias="pointsHistogram"
    )
    """Points per annotation instance"""

    format_distribution: dict[str, float] = Field(alias="formatDistribution")
    """Image format counts (ext → count)"""

    file_size_histogram: list[DatasetsRetrieveClassStatsResponseImageStatsFileSizeHistogramItem] = Field(
        alias="fileSizeHistogram"
    )

    objects_per_image_histogram: list[DatasetsRetrieveClassStatsResponseImageStatsObjectsPerImageHistogramItem] = Field(
        alias="objectsPerImageHistogram"
    )

    bbox_width_histogram: list[DatasetsRetrieveClassStatsResponseImageStatsBboxWidthHistogramItem] = Field(
        alias="bboxWidthHistogram"
    )

    bbox_height_histogram: list[DatasetsRetrieveClassStatsResponseImageStatsBboxHeightHistogramItem] = Field(
        alias="bboxHeightHistogram"
    )

    bbox_width_norm_histogram: list[DatasetsRetrieveClassStatsResponseImageStatsBboxWidthNormHistogramItem] = Field(
        alias="bboxWidthNormHistogram"
    )

    bbox_height_norm_histogram: list[DatasetsRetrieveClassStatsResponseImageStatsBboxHeightNormHistogramItem] = Field(
        alias="bboxHeightNormHistogram"
    )


class DatasetsRetrieveClassStatsResponseLocationHeatmap(APIModel):
    bins: list[list[float]]

    max_count: float = Field(alias="maxCount")


class DatasetsRetrieveClassStatsResponseDimensionHeatmap(APIModel):
    bins: list[list[float]]

    max_count: float = Field(alias="maxCount")

    min_width: float = Field(alias="minWidth")

    max_width: float = Field(alias="maxWidth")

    min_height: float = Field(alias="minHeight")

    max_height: float = Field(alias="maxHeight")


class DatasetsRetrieveClassStatsResponse(APIModel):
    classes: list[DatasetsRetrieveClassStatsResponseClassesItem]
    """Per-class annotation counts (all defined classes)"""

    image_stats: DatasetsRetrieveClassStatsResponseImageStats = Field(alias="imageStats")
    """Image and annotation distributions"""

    location_heatmap: DatasetsRetrieveClassStatsResponseLocationHeatmap = Field(alias="locationHeatmap")
    """20x20 grid of bbox center counts"""

    dimension_heatmap: DatasetsRetrieveClassStatsResponseDimensionHeatmap = Field(alias="dimensionHeatmap")
    """20x20 grid of image width vs height counts"""

    class_names: list[str] = Field(alias="classNames")
    """Dataset class names by index"""

    cached: bool
    """Whether stats were served from the pre-computed cache"""

    sample_size: float | None = Field(alias="sampleSize", default=None)
    """Number of images included; set only when stats came from a capped subset"""


class DatasetsMergeClassesResponse(APIModel):
    success: Literal[True]

    class_names: list[str] = Field(alias="classNames")

    class_colors: dict[str, str] = Field(alias="classColors")

    merged_class_ids: list[int] = Field(alias="mergedClassIds")

    target_class_id: int = Field(alias="targetClassId")


class DatasetsDeleteClassesResponse(APIModel):
    success: Literal[True]

    class_names: list[str] = Field(alias="classNames")

    class_colors: dict[str, str] = Field(alias="classColors")

    deleted_class_ids: list[int] = Field(alias="deletedClassIds")

    deleted_annotations: int = Field(alias="deletedAnnotations")


class DatasetsRedistributeSplitsResponseSplits(APIModel):
    train: int

    val: int

    test: int


class DatasetsRedistributeSplitsResponse(APIModel):
    success: Literal[True]

    splits: DatasetsRedistributeSplitsResponseSplits

    modified: int


class DatasetsListImagesResponseImagesItemLabelsItem(APIModel):
    class_id: float = Field(alias="classId")
    """Class index (0-based)"""

    bbox: list[float] | None = Field(default=None)
    """Bounding box [x_center, y_center, width, height] normalized 0-1"""

    segments: list[float] | None = Field(default=None)
    """Segmentation points, normalized 0-1"""

    keypoints: list[float] | None = Field(default=None)
    """Keypoints [x, y, visibility, ...] normalized 0-1"""

    obb: list[float] | None = Field(default=None)
    """Oriented bounding box [x1,y1,x2,y2,x3,y3,x4,y4] normalized 0-1"""

    skeleton_id: str | None = Field(alias="skeletonId", default=None)
    """Skeleton template ID for pose keypoint connections"""


class DatasetsListImagesResponseImagesItem(APIModel):
    id: str
    """Image ID"""

    hash: str
    """XXH3-128 image hash"""

    ext: str
    """Stored file extension without dot"""

    thumbnail_url: str | None = Field(alias="thumbnailUrl", default=None)
    """Signed 256x256 WebP thumbnail URL when thumbnails are requested"""

    image_url: str | None = Field(alias="imageUrl", default=None)
    """Signed full-size image URL when explicitly requested"""

    width: float
    """Image width in pixels"""

    height: float
    """Image height in pixels"""

    split: Literal["train", "val", "test"]
    """Dataset split"""

    label_count: float = Field(alias="labelCount")
    """Number of annotations on this image"""

    name: str
    """Original image basename without suffix"""

    bytes: float | None = Field(default=None)
    """Original file size in bytes"""

    error: str | None = Field(default=None)
    """Processing error message, if any"""

    labels: list[DatasetsListImagesResponseImagesItemLabelsItem] | None = Field(default=None)
    """Preview annotations returned only when includeLabels=true or overlayLabels=true"""

    labels_truncated: Literal[True] | None = Field(alias="labelsTruncated", default=None)
    """Preview labels omit annotations or polygon points"""


class DatasetsListImagesResponse(APIModel):
    images: list[DatasetsListImagesResponseImagesItem]

    total: float | None = Field(default=None)
    """Total matching images. Omitted when includeTotal=false"""

    has_more: bool = Field(alias="hasMore")
    """Whether more images remain after this page"""

    classes: list[str]
    """Dataset class names"""

    error_count: float = Field(alias="errorCount")
    """Total images with processing errors"""

    next_cursor: str | None = Field(alias="nextCursor", default=None)
    """Cursor for the next page when using cursor-based pagination"""


class DatasetsRetrieveSelectedImagesResponseImagesItemLabelsItem(APIModel):
    class_id: float = Field(alias="classId")
    """Class index (0-based)"""

    bbox: list[float] | None = Field(default=None)
    """Bounding box [x_center, y_center, width, height] normalized 0-1"""

    segments: list[float] | None = Field(default=None)
    """Segmentation points, normalized 0-1"""

    keypoints: list[float] | None = Field(default=None)
    """Keypoints [x, y, visibility, ...] normalized 0-1"""

    obb: list[float] | None = Field(default=None)
    """Oriented bounding box [x1,y1,x2,y2,x3,y3,x4,y4] normalized 0-1"""

    skeleton_id: str | None = Field(alias="skeletonId", default=None)
    """Skeleton template ID for pose keypoint connections"""


class DatasetsRetrieveSelectedImagesResponseImagesItem(APIModel):
    id: str
    """Image ID"""

    hash: str
    """XXH3-128 image hash"""

    ext: str
    """Stored file extension without dot"""

    thumbnail_url: str | None = Field(alias="thumbnailUrl", default=None)
    """Signed 256x256 WebP thumbnail URL when thumbnails are requested"""

    image_url: str | None = Field(alias="imageUrl", default=None)
    """Signed full-size image URL when explicitly requested"""

    width: float
    """Image width in pixels"""

    height: float
    """Image height in pixels"""

    split: Literal["train", "val", "test"]
    """Dataset split"""

    label_count: float = Field(alias="labelCount")
    """Number of annotations on this image"""

    name: str
    """Original image basename without suffix"""

    bytes: float | None = Field(default=None)
    """Original file size in bytes"""

    error: str | None = Field(default=None)
    """Processing error message, if any"""

    labels: list[DatasetsRetrieveSelectedImagesResponseImagesItemLabelsItem] | None = Field(default=None)
    """Preview annotations returned only when includeLabels=true or overlayLabels=true"""

    labels_truncated: Literal[True] | None = Field(alias="labelsTruncated", default=None)
    """Preview labels omit annotations or polygon points"""


class DatasetsRetrieveSelectedImagesResponse(APIModel):
    images: list[DatasetsRetrieveSelectedImagesResponseImagesItem]

    total: int

    has_more: Literal[False] = Field(alias="hasMore")

    classes: list[str]

    error_count: int = Field(alias="errorCount")


class DatasetsRetrieveExportResponse(APIModel):
    download_url: str = Field(alias="downloadUrl")

    version: int | None = Field(default=None)

    cached: bool | None = Field(default=None)


class DatasetsCreateExportResponse(APIModel):
    version: int

    download_url: str = Field(alias="downloadUrl")

    reused: bool


class DatasetsUpdateExportResponse(APIModel):
    ok: Literal[True]


class DatasetsIngestResponse(APIModel):
    job_id: str = Field(alias="jobId")
    """Queued ingest job ID"""

    dataset_id: str = Field(alias="datasetId")
    """Target dataset ID"""

    status: Literal["queued"]


class DatasetsRetrieveEmbeddingsResponseActiveJobProgress(APIModel):
    stage: Literal["embedding", "umap"]

    percent: float

    processed: float | None = Field(default=None)

    total: float | None = Field(default=None)

    failed_downloads: float | None = Field(alias="failedDownloads", default=None)

    failed_inference: float | None = Field(alias="failedInference", default=None)


class DatasetsRetrieveEmbeddingsResponseActiveJob(APIModel):
    id: str

    status: Literal["queued", "starting", "running"]

    progress: DatasetsRetrieveEmbeddingsResponseActiveJobProgress

    created_at: datetime = Field(alias="createdAt")


class DatasetsRetrieveEmbeddingsResponse(APIModel):
    analyzed_at: str | None = Field(alias="analyzedAt")

    embeddings_count: int = Field(alias="embeddingsCount")

    latest_image_at: str | None = Field(alias="latestImageAt")

    active_job: DatasetsRetrieveEmbeddingsResponseActiveJob = Field(alias="activeJob")


class DatasetsCreateEmbeddingsResponse(APIModel):
    job_id: str = Field(alias="jobId")


class DatasetsDeleteEmbeddingsResponse(APIModel):
    cancelled: str | None


class DatasetsRetrieveImagesClusteringResponseImagesItem(APIModel):
    id: str

    umap_x: float = Field(alias="umapX")

    umap_y: float = Field(alias="umapY")

    split: Literal["train", "val", "test"] | None

    class_ids: list[int] = Field(alias="classIds")

    width: float

    height: float

    bytes: float | None

    label_count: int = Field(alias="labelCount")

    missing: bool


class DatasetsRetrieveImagesClusteringResponse(APIModel):
    images: list[DatasetsRetrieveImagesClusteringResponseImagesItem]

    total: int

    offset: int

    limit: int

    has_more: bool = Field(alias="hasMore")

    next_offset: int | None = Field(alias="nextOffset")

    updated_at: datetime = Field(alias="updatedAt")


class DatasetsListModelsResponseModelsItemDatasetVersion(APIModel):
    version: int

    content_hash: str = Field(alias="contentHash")


class DatasetsListModelsResponseModelsItem(APIModel):
    id: str = Field(alias="_id")

    name: str

    slug: str

    status: Literal["pending", "untrained", "starting", "running", "completed", "failed", "cancelled"]
    """Training/model status"""

    task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"] | None = Field(default=None)
    """YOLO task type"""

    dataset_version: DatasetsListModelsResponseModelsItemDatasetVersion | None = Field(
        alias="datasetVersion", default=None
    )

    epochs: float | None = Field(default=None)

    best_epoch: float | None = Field(alias="bestEpoch", default=None)

    best_fitness: float | None = Field(alias="bestFitness", default=None)

    metrics: dict[str, float]

    started_at: datetime | None = Field(alias="startedAt", default=None)

    completed_at: datetime | None = Field(alias="completedAt", default=None)

    created_at: datetime = Field(alias="createdAt")

    project_id: str = Field(alias="projectId")

    project_slug: str | None = Field(alias="projectSlug", default=None)

    project_icon_color: str | None = Field(alias="projectIconColor", default=None)

    project_icon_letter: str | None = Field(alias="projectIconLetter", default=None)

    project_icon_image: str | None = Field(alias="projectIconImage", default=None)

    username: str


class DatasetsListModelsResponse(APIModel):
    models: list[DatasetsListModelsResponseModelsItem]

    count: int


class DatasetsRestoreResponse(APIModel):
    version: int

    image_count: int = Field(alias="imageCount")


class DatasetsPreviewRoboflowImportResponseWorkspace(APIModel):
    url: str

    name: str


class DatasetsPreviewRoboflowImportResponseNewDatasetsItem(APIModel):
    workspace: str

    project_id: str = Field(alias="projectId")

    project_name: str = Field(alias="projectName")

    project_type: str = Field(alias="projectType")

    latest_version: int = Field(alias="latestVersion")

    latest_version_name: str | None = Field(alias="latestVersionName", default=None)


class DatasetsPreviewRoboflowImportResponseStorage(APIModel):
    used_bytes: float = Field(alias="usedBytes")

    limit_bytes: float = Field(alias="limitBytes")

    has_enough_storage: bool = Field(alias="hasEnoughStorage")


class DatasetsPreviewRoboflowImportResponse(APIModel):
    workspace: DatasetsPreviewRoboflowImportResponseWorkspace

    new_datasets: list[DatasetsPreviewRoboflowImportResponseNewDatasetsItem] = Field(alias="newDatasets")

    skipped_count: int = Field(alias="skippedCount")

    missing_version_count: int = Field(alias="missingVersionCount")

    unsupported_count: int = Field(alias="unsupportedCount")

    unresolved_count: int = Field(alias="unresolvedCount")

    bytes_total: int = Field(alias="bytesTotal")

    storage: DatasetsPreviewRoboflowImportResponseStorage


class DatasetsImportFromRoboflowResponseImportedItem(APIModel):
    project_id: str = Field(alias="projectId")

    project_name: str = Field(alias="projectName")

    version: int

    dataset_id: str = Field(alias="datasetId")

    slug: str


class DatasetsImportFromRoboflowResponseFailedItem(APIModel):
    project_id: str = Field(alias="projectId")

    project_name: str = Field(alias="projectName")

    version: int

    error: str


class DatasetsImportFromRoboflowResponseSkippedItem(APIModel):
    project_id: str = Field(alias="projectId")

    project_name: str = Field(alias="projectName")

    version: int


class DatasetsImportFromRoboflowResponse(APIModel):
    imported: list[DatasetsImportFromRoboflowResponseImportedItem]

    failed: list[DatasetsImportFromRoboflowResponseFailedItem]

    skipped: list[DatasetsImportFromRoboflowResponseSkippedItem]


class DatasetsCreateIconResponse(APIModel):
    success: Literal[True]

    download_url: str = Field(alias="downloadUrl")


class DatasetsDeleteIconResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class ImagesRetrieveLabelsResponseLabelsItem(APIModel):
    class_id: float = Field(alias="classId")
    """Class index (0-based)"""

    bbox: list[float] | None = Field(default=None)
    """Bounding box [x_center, y_center, width, height] normalized 0-1"""

    segments: list[float] | None = Field(default=None)
    """Segmentation points, normalized 0-1"""

    keypoints: list[float] | None = Field(default=None)
    """Keypoints [x, y, visibility, ...] normalized 0-1"""

    obb: list[float] | None = Field(default=None)
    """Oriented bounding box [x1,y1,x2,y2,x3,y3,x4,y4] normalized 0-1"""

    skeleton_id: str | None = Field(alias="skeletonId", default=None)
    """Skeleton template ID for pose keypoint connections"""


class ImagesRetrieveLabelsResponse(APIModel):
    labels: list[ImagesRetrieveLabelsResponseLabelsItem]
    """Annotations for this image"""

    class_names: list[str] = Field(alias="classNames")
    """Class names from dataset"""

    labels_truncated: Literal[True] | None = Field(alias="labelsTruncated", default=None)
    """More annotations exist than this response includes"""


class ImagesUpdateLabelsResponseLabelsItem(APIModel):
    class_id: float = Field(alias="classId")
    """Class index (0-based)"""

    bbox: list[float] | None = Field(default=None)
    """Bounding box [x_center, y_center, width, height] normalized 0-1"""

    segments: list[float] | None = Field(default=None)
    """Segmentation points, normalized 0-1"""

    keypoints: list[float] | None = Field(default=None)
    """Keypoints [x, y, visibility, ...] normalized 0-1"""

    obb: list[float] | None = Field(default=None)
    """Oriented bounding box [x1,y1,x2,y2,x3,y3,x4,y4] normalized 0-1"""

    skeleton_id: str | None = Field(alias="skeletonId", default=None)
    """Skeleton template ID for pose keypoint connections"""


class ImagesUpdateLabelsResponse(APIModel):
    success: Literal[True]

    labels: list[ImagesUpdateLabelsResponseLabelsItem]
    """Saved annotations (coordinates rounded to 5 decimal places)"""

    label_count: float = Field(alias="labelCount")
    """Total annotations on this image"""


class ImagesRetrieveMetadataResponseProperties(APIModel):
    id: str
    """Image ID"""

    dataset_id: str = Field(alias="datasetId")
    """Dataset ID"""

    filename: str

    hash: str
    """Image content hash"""

    extension: str

    original_extension: str | None = Field(alias="originalExtension", default=None)

    original_path: str | None = Field(alias="originalPath", default=None)

    width: int

    height: int

    split: Literal["train", "val", "test"]

    annotation_count: int = Field(alias="annotationCount")

    class_ids: list[int] | None = Field(alias="classIds", default=None)

    bytes: int | None = Field(default=None)

    region: Literal["us", "eu", "ap"] | None = Field(default=None)
    """Data region"""

    external_key: str | None = Field(alias="externalKey", default=None)

    external_revision: str | None = Field(alias="externalRevision", default=None)

    retained_by_version: bool = Field(alias="retainedByVersion")

    created_at: datetime = Field(alias="createdAt")

    updated_at: datetime | None = Field(alias="updatedAt", default=None)

    error: str | None = Field(default=None)


class ImagesRetrieveMetadataResponse(APIModel):
    metadata: dict[str, Any]
    """Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters."""

    properties: ImagesRetrieveMetadataResponseProperties


class ImagesUpdateMetadataResponse(APIModel):
    metadata: dict[str, Any]
    """Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters."""

    updated_at: datetime = Field(alias="updatedAt")


class ImagesUpdateBulkResponse(APIModel):
    success: Literal[True]

    modified_count: float = Field(alias="modifiedCount")
    """Number of images moved"""

    skipped_count: float = Field(alias="skippedCount")
    """Number of conflicting source images left unchanged"""

    target_split: str = Field(alias="targetSplit")
    """Target split"""


class ImagesDeleteBulkResponse(APIModel):
    success: Literal[True]

    deleted_count: float = Field(alias="deletedCount")
    """Number of images deleted"""

    deleted_image_ids: list[str] = Field(alias="deletedImageIds")
    """Deleted image IDs"""


class ImagesPredictResponsePredictionsItem(APIModel):
    class_id: float = Field(alias="classId")

    bbox: list[float] | None = Field(default=None)

    segments: list[float] | None = Field(default=None)

    keypoints: list[float] | None = Field(default=None)

    obb: list[float] | None = Field(default=None)


class ImagesPredictResponse(APIModel):
    success: Literal[True]

    predictions: list[ImagesPredictResponsePredictionsItem]
    """Predicted annotations"""

    model_used: str = Field(alias="modelUsed")
    """Model that was used for inference"""

    inference_time: float | None = Field(alias="inferenceTime", default=None)
    """Inference time in milliseconds"""


class ImagesRetrieveSignedUrlsResponse(APIModel):
    urls: dict[str, str]
    """Full-size URLs keyed by image ID"""

    thumbnails: dict[str, str]
    """Thumbnail URLs keyed by image ID"""


class ImagesDeleteResponse(APIModel):
    success: Literal[True]

    deleted_image_id: str = Field(alias="deletedImageId")

    deleted_count: int = Field(alias="deletedCount")


class ProjectsListResponseProjectsItemViewPreferences(APIModel):
    sort_by: Literal["newest", "oldest", "name-asc", "name-desc", "size-asc", "size-desc"] | None = Field(
        alias="sortBy", default=None
    )

    group_by: Literal["none", "task"] | None = Field(alias="groupBy", default=None)

    status_filter: Literal["all", "completed", "running", "starting", "failed"] | None = Field(
        alias="statusFilter", default=None
    )


class ProjectsListResponseProjectsItem(APIModel):
    id: str = Field(alias="_id")
    """Project ID"""

    username: str
    """Owner's username"""

    slug: str
    """Project URL, e.g. `my-project` from platform.ultralytics.com/username/my-project"""

    name: str
    """Display name"""

    description: str | None = Field(default=None)
    """Project description"""

    visibility: Literal["public", "private"]
    """Visibility"""

    tags: list[str] | None = Field(default=None)
    """Tags"""

    license: (
        Literal[
            "None",
            "Apache-2.0",
            "MIT",
            "BSD-3-Clause",
            "AGPL-3.0",
            "GPL-3.0",
            "LGPL-3.0",
            "MPL-2.0",
            "EUPL-1.1",
            "Unlicense",
            "CC0-1.0",
            "Ultralytics-Enterprise",
            "Other",
        ]
        | None
    ) = Field(default=None)
    """License"""

    icon_color: str | None = Field(alias="iconColor", default=None)
    """Icon background color"""

    icon_letter: str | None = Field(alias="iconLetter", default=None)
    """Icon letter(s)"""

    icon_image: str | None = Field(alias="iconImage", default=None)
    """Icon image URL"""

    model_count: float = Field(alias="modelCount")
    """Number of models"""

    model_names: list[str] | None = Field(alias="modelNames", default=None)
    """Model names"""

    total_bytes: float | None = Field(alias="totalBytes", default=None)
    """Total model storage size in bytes"""

    star_count: float = Field(alias="starCount")
    """Number of stars"""

    is_starred: bool = Field(alias="isStarred")
    """Whether current user starred this"""

    archived: bool | None = Field(default=None)
    """Archived status"""

    region: Literal["us", "eu", "ap"] | None = Field(default=None)
    """Project data region"""

    task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"] | None = Field(default=None)
    """Default task type for models in this project"""

    cloned_from: str | None = Field(alias="clonedFrom", default=None)
    """Source project ID if this is a clone"""

    clone_count: float | None = Field(alias="cloneCount", default=None)
    """Number of times this project has been cloned"""

    total_model_download_count: float | None = Field(alias="totalModelDownloadCount", default=None)
    """Total model downloads across this project"""

    total_export_download_count: float | None = Field(alias="totalExportDownloadCount", default=None)
    """Total export downloads across this project"""

    view_preferences: ProjectsListResponseProjectsItemViewPreferences | None = Field(
        alias="viewPreferences", default=None
    )
    """Shared project-level model view defaults"""

    created_at: datetime = Field(alias="createdAt")
    """Creation timestamp"""

    updated_at: datetime = Field(alias="updatedAt")
    """Last update timestamp"""


class ProjectsListResponse(APIModel):
    projects: list[ProjectsListResponseProjectsItem]

    total: float
    """Total matching projects"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class ProjectsCreateResponse(APIModel):
    project_id: str | None = Field(alias="projectId", default=None)
    """Created project ID"""

    dataset_id: str | None = Field(alias="datasetId", default=None)
    """Created dataset ID"""

    model_id: str | None = Field(alias="modelId", default=None)
    """Created model ID"""

    slug: str
    """Resource name, e.g. `my-dataset`"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class ProjectsRetrieveResponseProjectViewPreferences(APIModel):
    sort_by: Literal["newest", "oldest", "name-asc", "name-desc", "size-asc", "size-desc"] | None = Field(
        alias="sortBy", default=None
    )

    group_by: Literal["none", "task"] | None = Field(alias="groupBy", default=None)

    status_filter: Literal["all", "completed", "running", "starting", "failed"] | None = Field(
        alias="statusFilter", default=None
    )


class ProjectsRetrieveResponseProject(APIModel):
    id: str = Field(alias="_id")
    """Project ID"""

    username: str
    """Owner's username"""

    slug: str
    """Project URL, e.g. `my-project` from platform.ultralytics.com/username/my-project"""

    name: str
    """Display name"""

    description: str | None = Field(default=None)
    """Project description"""

    visibility: Literal["public", "private"]
    """Visibility"""

    tags: list[str] | None = Field(default=None)
    """Tags"""

    license: (
        Literal[
            "None",
            "Apache-2.0",
            "MIT",
            "BSD-3-Clause",
            "AGPL-3.0",
            "GPL-3.0",
            "LGPL-3.0",
            "MPL-2.0",
            "EUPL-1.1",
            "Unlicense",
            "CC0-1.0",
            "Ultralytics-Enterprise",
            "Other",
        ]
        | None
    ) = Field(default=None)
    """License"""

    icon_color: str | None = Field(alias="iconColor", default=None)
    """Icon background color"""

    icon_letter: str | None = Field(alias="iconLetter", default=None)
    """Icon letter(s)"""

    icon_image: str | None = Field(alias="iconImage", default=None)
    """Icon image URL"""

    star_count: float = Field(alias="starCount")
    """Number of stars"""

    is_starred: bool = Field(alias="isStarred")
    """Whether current user starred this"""

    archived: bool | None = Field(default=None)
    """Archived status"""

    region: Literal["us", "eu", "ap"] | None = Field(default=None)
    """Project data region"""

    task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"] | None = Field(default=None)
    """Default task type for models in this project"""

    cloned_from: str | None = Field(alias="clonedFrom", default=None)
    """Source project ID if this is a clone"""

    clone_count: float | None = Field(alias="cloneCount", default=None)
    """Number of times this project has been cloned"""

    total_model_download_count: float | None = Field(alias="totalModelDownloadCount", default=None)
    """Total model downloads across this project"""

    total_export_download_count: float | None = Field(alias="totalExportDownloadCount", default=None)
    """Total export downloads across this project"""

    view_preferences: ProjectsRetrieveResponseProjectViewPreferences | None = Field(
        alias="viewPreferences", default=None
    )
    """Shared project-level model view defaults"""

    created_at: datetime = Field(alias="createdAt")
    """Creation timestamp"""

    updated_at: datetime = Field(alias="updatedAt")
    """Last update timestamp"""


class ProjectsRetrieveResponse(APIModel):
    project: ProjectsRetrieveResponseProject
    """Project detail"""

    is_owner: bool = Field(alias="isOwner")
    """Whether the current user owns the project"""


class ProjectsUpdateResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class ProjectsDeleteResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class ProjectsRetrieveMetadataResponse(APIModel):
    metadata: dict[str, Any]
    """Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters."""

    properties: list[list[Any]]
    """Ultralytics-managed field and value pairs"""


class ProjectsCloneResponse(APIModel):
    project_id: str = Field(alias="projectId")
    """Cloned project ID"""

    slug: str
    """Cloned project slug"""

    name: str
    """Cloned project name"""

    model_count: float = Field(alias="modelCount")
    """Number of models copied into the clone"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class ProjectsCreateIconResponse(APIModel):
    success: Literal[True]

    download_url: str = Field(alias="downloadUrl")


class ProjectsDeleteIconResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class ModelsListResponseModelsItemDatasetVersion(APIModel):
    version: float

    content_hash: str = Field(alias="contentHash")


class ModelsListResponseModelsItemTrainArgs(APIModel):
    model: str | None = Field(default=None)

    classes: list[int] | None = Field(default=None)

    lr0: float | None = Field(default=None)
    """Initial learning rate. Higher values (e.g. 0.01) train faster but may be unstable; lower values (e.g., 0.001) are safer but slower."""

    lrf: float | None = Field(default=None)
    """Final learning rate factor. Controls how fast learning is at the end of training. Lower values help the model fine-tune."""

    momentum: float | None = Field(default=None)
    """Controls how much past updates influence current optimization. Higher values (e.g. 0.9) speed up training but may overshoot."""

    weight_decay: float | None = Field(default=None)
    """L2 regularization to prevent overfitting. Higher values reduce complexity but may slow learning."""

    warmup_epochs: float | None = Field(default=None)
    """Gradually increases the learning rate over the first N epochs to stabilize training."""

    warmup_momentum: float | None = Field(default=None)
    """Gradually increases momentum during warmup to stabilize early training."""

    warmup_bias_lr: float | None = Field(default=None)
    """Learning rate for bias parameters during warmup phase to help stabilize early training."""

    optimizer: Literal["auto", "SGD", "MuSGD", "Adam", "AdamW", "NAdam", "RAdam", "RMSProp", "Adamax"] | None = Field(
        default=None
    )
    """Optimization algorithm. Auto selects the best optimizer based on model and training setup."""

    box: float | None = Field(default=None)
    """Bounding box loss weight. Adjusts how localization errors impact training."""

    cls: float | None = Field(default=None)
    """Classification loss weight. Adjusts how class prediction errors contribute to total loss."""

    dfl: float | None = Field(default=None)
    """Distribution Focal Loss weight. Adjusts how much DFL impacts box regression accuracy."""

    pose: float | None = Field(default=None)
    """Pose loss weight (pose task only). Controls keypoint localization importance."""

    kobj: float | None = Field(default=None)
    """Keypoint objectness weight (pose task only). Controls keypoint visibility prediction."""

    label_smoothing: float | None = Field(default=None)
    """Label smoothing factor. Adds regularization by softening one-hot labels."""

    hsv_h: float | None = Field(default=None)
    """HSV-Hue augmentation range for color variation."""

    hsv_s: float | None = Field(default=None)
    """HSV-Saturation augmentation range for color variation."""

    hsv_v: float | None = Field(default=None)
    """HSV-Value (brightness) augmentation range for lighting variation."""

    degrees: float | None = Field(default=None)
    """Image rotation range in degrees for augmentation."""

    translate: float | None = Field(default=None)
    """Image translation range (fraction of image size) for position augmentation."""

    scale: float | None = Field(default=None)
    """Image scaling range for size augmentation."""

    shear: float | None = Field(default=None)
    """Image shear range in degrees for shape augmentation."""

    perspective: float | None = Field(default=None)
    """Perspective transformation range for view augmentation."""

    flipud: float | None = Field(default=None)
    """Probability of vertical flip augmentation."""

    fliplr: float | None = Field(default=None)
    """Probability of horizontal flip augmentation."""

    mosaic: float | None = Field(default=None)
    """Probability of mosaic augmentation (combining 4 images into one)."""

    mixup: float | None = Field(default=None)
    """Probability of mixup augmentation (blending two images)."""

    copy_paste: float | None = Field(default=None)
    """Probability of copy-paste augmentation (segment task). Copies objects to new positions."""

    epochs: int | None = Field(default=None)
    """Total number of training epochs. More epochs allow the model to learn more but take longer."""

    batch: int | None = Field(default=None)
    """Batch size for training. Use -1 for auto-batch to fit available GPU memory, or set a fixed size."""

    imgsz: int | None = Field(default=None)
    """Input image size for training. Larger sizes improve accuracy but use more memory and time."""

    pretrained: bool | None = Field(default=None)
    """Start from pretrained weights. Disable to keep the selected model architecture with random weights."""

    patience: int | None = Field(default=None)
    """Early stopping patience. Epochs to wait after no improvement before stopping. Lower values save time but risk early termination."""

    time: float | None = Field(default=None)
    """Training time limit in hours. Training stops after this time regardless of epochs."""

    seed: int | None = Field(default=None)
    """Random seed for reproducibility. Use 0 for random behavior."""

    deterministic: bool | None = Field(default=None)
    """Ensures exact reproducibility by disabling GPU randomness. May slow down training."""

    amp: bool | None = Field(default=None)
    """Mixed precision training (FP16 + FP32). Speeds up training and reduces memory usage on modern GPUs."""

    cos_lr: bool | None = Field(default=None)
    """Cosine learning rate scheduler. Gradually reduces LR following a cosine curve for smoother training."""

    compile: bool | Literal["default", "reduce-overhead", "max-autotune", "max-autotune-no-cudagraphs"] | None = Field(
        default=None
    )
    """Compile the model with torch.compile for faster training on modern GPUs after a slower first epoch. Also accepts a compile mode name (default, reduce-overhead, max-autotune, max-autotune-no-cudagraphs)."""

    close_mosaic: int | None = Field(default=None)
    """Disable mosaic augmentation in final N epochs for better fine-tuning. Set 0 to keep always on."""

    save_period: int | None = Field(default=None)
    """Save checkpoint every N epochs. -1 saves only best and last."""

    fraction: float | None = Field(default=None)
    """Fraction of dataset to use for training (1.0 = full dataset)."""

    freeze: int | None = Field(default=None)
    """Number of layers to freeze. Retains pretrained features. Use null to train all layers."""

    single_cls: bool | None = Field(default=None)
    """Treat all classes as a single class. Useful for class-agnostic detection."""

    rect: bool | None = Field(default=None)
    """Rectangular training. Reduces padding but may lower accuracy due to less randomization."""

    multi_scale: float | None = Field(default=None)
    """Multi-scale range as a fraction of imgsz. 0 disables, otherwise trains at varying sizes (max 0.9)."""

    val: bool | None = Field(default=None)
    """Run validation during training. Disable for faster training (not recommended)."""

    resume: bool | None = Field(default=None)

    device: Literal["0", "auto", "cpu", "mps"] | None = Field(default=None)
    """Training device. Auto selects best available (CUDA > MPS > CPU)."""

    cache: Literal["ram", "disk", "false"] | None = Field(default=None)
    """Dataset caching strategy. RAM is fastest but uses more memory. Disk is slower but saves RAM. False loads on-the-fly."""

    workers: int | None = Field(default=None)
    """Number of data loader workers for parallel loading."""

    dropout: float | None = Field(default=None)
    """Dropout rate for classification head regularization."""

    iou: float | None = Field(default=None)
    """IoU threshold for NMS during validation."""

    max_det: int | None = Field(default=None)
    """Maximum detections per image during inference."""


class ModelsListResponseModelsItemTrainResultsItem(APIModel):
    epoch: float | None = Field(default=None)

    metrics: dict[str, float] | None = Field(default=None)

    fitness: float | None = Field(default=None)

    timestamp: datetime | None = Field(default=None)


class ModelsListResponseModelsItemFile(APIModel):
    size: float


class ModelsListResponseModelsItemTrainingError(APIModel):
    message: str
    """Client-safe training failure message"""

    code: str | None = Field(default=None)

    timestamp: datetime


class ModelsListResponseModelsItem(APIModel):
    id: str = Field(alias="_id")
    """Model ID"""

    username: str | None = Field(default=None)
    """Owner's username"""

    project_id: str | None = Field(alias="projectId", default=None)
    """Parent project ID"""

    project_slug: str | None = Field(alias="projectSlug", default=None)
    """Parent project URL, e.g. `my-project`"""

    slug: str | None = Field(default=None)
    """Model URL, e.g. `my-model` from platform.ultralytics.com/username/my-project/my-model"""

    name: str
    """Display name"""

    description: str | None = Field(default=None)
    """Model description"""

    status: Literal["pending", "untrained", "starting", "running", "completed", "failed", "cancelled"] | None = Field(
        default=None
    )
    """Training/model status"""

    task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"] | None = Field(default=None)
    """YOLO task type"""

    color: str | None = Field(default=None)

    license: (
        Literal[
            "None",
            "Apache-2.0",
            "MIT",
            "BSD-3-Clause",
            "AGPL-3.0",
            "GPL-3.0",
            "LGPL-3.0",
            "MPL-2.0",
            "EUPL-1.1",
            "Unlicense",
            "CC0-1.0",
            "Ultralytics-Enterprise",
            "Other",
        ]
        | None
    ) = Field(default=None)
    """License"""

    dataset_id: str | None = Field(alias="datasetId", default=None)
    """Source dataset ID"""

    dataset_version: ModelsListResponseModelsItemDatasetVersion | None = Field(alias="datasetVersion", default=None)

    source_model_id: str | None = Field(alias="sourceModelId", default=None)
    """Source model ID"""

    epochs: float | None = Field(default=None)
    """Total epochs"""

    best_epoch: float | None = Field(alias="bestEpoch", default=None)
    """Best epoch number"""

    best_fitness: float | None = Field(alias="bestFitness", default=None)
    """Best fitness score"""

    train_args: ModelsListResponseModelsItemTrainArgs | None = Field(alias="trainArgs", default=None)
    """Public training configuration; dataset, unknown fields, and local model paths are omitted"""

    version: str | None = Field(default=None)
    """Ultralytics version"""

    docs: str | None = Field(default=None)
    """Model documentation URL"""

    started_at: datetime | None = Field(alias="startedAt", default=None)

    completed_at: datetime | None = Field(alias="completedAt", default=None)

    class_names: list[str] | None = Field(alias="classNames", default=None)

    metrics: dict[str, float] | None = Field(default=None)

    train_results: list[ModelsListResponseModelsItemTrainResultsItem] | None = Field(alias="trainResults", default=None)

    has_weights: bool = Field(alias="hasWeights")
    """Whether trained or uploaded model weights are available"""

    file: ModelsListResponseModelsItemFile | None = Field(default=None)
    """Model file size"""

    plots: list[Any] | None = Field(default=None)
    """Validation plots"""

    training_error: ModelsListResponseModelsItemTrainingError | None = Field(alias="trainingError", default=None)

    star_count: float = Field(alias="starCount")
    """Number of stars"""

    is_starred: bool = Field(alias="isStarred")
    """Whether current user starred this"""

    cloned_from: str | None = Field(alias="clonedFrom", default=None)
    """Source model ID if this is a clone"""

    download_count: float | None = Field(alias="downloadCount", default=None)
    """Download count"""

    clone_count: float | None = Field(alias="cloneCount", default=None)
    """Clone count"""

    created_at: datetime | None = Field(alias="createdAt", default=None)
    """Creation timestamp"""

    updated_at: datetime | None = Field(alias="updatedAt", default=None)
    """Last update timestamp"""


class ModelsListResponse(APIModel):
    models: list[ModelsListResponseModelsItem]

    region: Literal["us", "eu", "ap"]
    """Data region"""


class ModelsCreateResponse(APIModel):
    project_id: str | None = Field(alias="projectId", default=None)
    """Created project ID"""

    dataset_id: str | None = Field(alias="datasetId", default=None)
    """Created dataset ID"""

    model_id: str | None = Field(alias="modelId", default=None)
    """Created model ID"""

    slug: str
    """Resource name, e.g. `my-dataset`"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class ModelsListCompletedResponseModelsItem(APIModel):
    id: str = Field(alias="_id")

    slug: str

    name: str

    task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"]
    """YOLO task type"""

    project_slug: str = Field(alias="projectSlug")

    project_name: str = Field(alias="projectName")

    project_icon_color: str | None = Field(alias="projectIconColor", default=None)

    project_icon_letter: str | None = Field(alias="projectIconLetter", default=None)

    best_fitness: float | None = Field(alias="bestFitness", default=None)


class ModelsListCompletedResponse(APIModel):
    models: list[ModelsListCompletedResponseModelsItem]


class ModelsRetrieveResponseModelDatasetVersion(APIModel):
    version: float

    content_hash: str = Field(alias="contentHash")


class ModelsRetrieveResponseModelTrainArgs(APIModel):
    model: str | None = Field(default=None)

    classes: list[int] | None = Field(default=None)

    lr0: float | None = Field(default=None)
    """Initial learning rate. Higher values (e.g. 0.01) train faster but may be unstable; lower values (e.g., 0.001) are safer but slower."""

    lrf: float | None = Field(default=None)
    """Final learning rate factor. Controls how fast learning is at the end of training. Lower values help the model fine-tune."""

    momentum: float | None = Field(default=None)
    """Controls how much past updates influence current optimization. Higher values (e.g. 0.9) speed up training but may overshoot."""

    weight_decay: float | None = Field(default=None)
    """L2 regularization to prevent overfitting. Higher values reduce complexity but may slow learning."""

    warmup_epochs: float | None = Field(default=None)
    """Gradually increases the learning rate over the first N epochs to stabilize training."""

    warmup_momentum: float | None = Field(default=None)
    """Gradually increases momentum during warmup to stabilize early training."""

    warmup_bias_lr: float | None = Field(default=None)
    """Learning rate for bias parameters during warmup phase to help stabilize early training."""

    optimizer: Literal["auto", "SGD", "MuSGD", "Adam", "AdamW", "NAdam", "RAdam", "RMSProp", "Adamax"] | None = Field(
        default=None
    )
    """Optimization algorithm. Auto selects the best optimizer based on model and training setup."""

    box: float | None = Field(default=None)
    """Bounding box loss weight. Adjusts how localization errors impact training."""

    cls: float | None = Field(default=None)
    """Classification loss weight. Adjusts how class prediction errors contribute to total loss."""

    dfl: float | None = Field(default=None)
    """Distribution Focal Loss weight. Adjusts how much DFL impacts box regression accuracy."""

    pose: float | None = Field(default=None)
    """Pose loss weight (pose task only). Controls keypoint localization importance."""

    kobj: float | None = Field(default=None)
    """Keypoint objectness weight (pose task only). Controls keypoint visibility prediction."""

    label_smoothing: float | None = Field(default=None)
    """Label smoothing factor. Adds regularization by softening one-hot labels."""

    hsv_h: float | None = Field(default=None)
    """HSV-Hue augmentation range for color variation."""

    hsv_s: float | None = Field(default=None)
    """HSV-Saturation augmentation range for color variation."""

    hsv_v: float | None = Field(default=None)
    """HSV-Value (brightness) augmentation range for lighting variation."""

    degrees: float | None = Field(default=None)
    """Image rotation range in degrees for augmentation."""

    translate: float | None = Field(default=None)
    """Image translation range (fraction of image size) for position augmentation."""

    scale: float | None = Field(default=None)
    """Image scaling range for size augmentation."""

    shear: float | None = Field(default=None)
    """Image shear range in degrees for shape augmentation."""

    perspective: float | None = Field(default=None)
    """Perspective transformation range for view augmentation."""

    flipud: float | None = Field(default=None)
    """Probability of vertical flip augmentation."""

    fliplr: float | None = Field(default=None)
    """Probability of horizontal flip augmentation."""

    mosaic: float | None = Field(default=None)
    """Probability of mosaic augmentation (combining 4 images into one)."""

    mixup: float | None = Field(default=None)
    """Probability of mixup augmentation (blending two images)."""

    copy_paste: float | None = Field(default=None)
    """Probability of copy-paste augmentation (segment task). Copies objects to new positions."""

    epochs: int | None = Field(default=None)
    """Total number of training epochs. More epochs allow the model to learn more but take longer."""

    batch: int | None = Field(default=None)
    """Batch size for training. Use -1 for auto-batch to fit available GPU memory, or set a fixed size."""

    imgsz: int | None = Field(default=None)
    """Input image size for training. Larger sizes improve accuracy but use more memory and time."""

    pretrained: bool | None = Field(default=None)
    """Start from pretrained weights. Disable to keep the selected model architecture with random weights."""

    patience: int | None = Field(default=None)
    """Early stopping patience. Epochs to wait after no improvement before stopping. Lower values save time but risk early termination."""

    time: float | None = Field(default=None)
    """Training time limit in hours. Training stops after this time regardless of epochs."""

    seed: int | None = Field(default=None)
    """Random seed for reproducibility. Use 0 for random behavior."""

    deterministic: bool | None = Field(default=None)
    """Ensures exact reproducibility by disabling GPU randomness. May slow down training."""

    amp: bool | None = Field(default=None)
    """Mixed precision training (FP16 + FP32). Speeds up training and reduces memory usage on modern GPUs."""

    cos_lr: bool | None = Field(default=None)
    """Cosine learning rate scheduler. Gradually reduces LR following a cosine curve for smoother training."""

    compile: bool | Literal["default", "reduce-overhead", "max-autotune", "max-autotune-no-cudagraphs"] | None = Field(
        default=None
    )
    """Compile the model with torch.compile for faster training on modern GPUs after a slower first epoch. Also accepts a compile mode name (default, reduce-overhead, max-autotune, max-autotune-no-cudagraphs)."""

    close_mosaic: int | None = Field(default=None)
    """Disable mosaic augmentation in final N epochs for better fine-tuning. Set 0 to keep always on."""

    save_period: int | None = Field(default=None)
    """Save checkpoint every N epochs. -1 saves only best and last."""

    fraction: float | None = Field(default=None)
    """Fraction of dataset to use for training (1.0 = full dataset)."""

    freeze: int | None = Field(default=None)
    """Number of layers to freeze. Retains pretrained features. Use null to train all layers."""

    single_cls: bool | None = Field(default=None)
    """Treat all classes as a single class. Useful for class-agnostic detection."""

    rect: bool | None = Field(default=None)
    """Rectangular training. Reduces padding but may lower accuracy due to less randomization."""

    multi_scale: float | None = Field(default=None)
    """Multi-scale range as a fraction of imgsz. 0 disables, otherwise trains at varying sizes (max 0.9)."""

    val: bool | None = Field(default=None)
    """Run validation during training. Disable for faster training (not recommended)."""

    resume: bool | None = Field(default=None)

    device: Literal["0", "auto", "cpu", "mps"] | None = Field(default=None)
    """Training device. Auto selects best available (CUDA > MPS > CPU)."""

    cache: Literal["ram", "disk", "false"] | None = Field(default=None)
    """Dataset caching strategy. RAM is fastest but uses more memory. Disk is slower but saves RAM. False loads on-the-fly."""

    workers: int | None = Field(default=None)
    """Number of data loader workers for parallel loading."""

    dropout: float | None = Field(default=None)
    """Dropout rate for classification head regularization."""

    iou: float | None = Field(default=None)
    """IoU threshold for NMS during validation."""

    max_det: int | None = Field(default=None)
    """Maximum detections per image during inference."""


class ModelsRetrieveResponseModelTrainResultsItem(APIModel):
    epoch: float | None = Field(default=None)

    metrics: dict[str, float] | None = Field(default=None)

    fitness: float | None = Field(default=None)

    timestamp: datetime | None = Field(default=None)


class ModelsRetrieveResponseModelFile(APIModel):
    size: float


class ModelsRetrieveResponseModelTrainingError(APIModel):
    message: str
    """Client-safe training failure message"""

    code: str | None = Field(default=None)

    timestamp: datetime


class ModelsRetrieveResponseModelSourceModel(APIModel):
    username: str
    """Owner username of the source model"""

    project_slug: str = Field(alias="projectSlug")
    """Source project slug"""

    project_name: str = Field(alias="projectName")
    """Source project name"""

    project_icon_color: str | None = Field(alias="projectIconColor", default=None)
    """Source project icon color"""

    project_icon_letter: str | None = Field(alias="projectIconLetter", default=None)
    """Source project icon letter"""

    project_icon_image: str | None = Field(alias="projectIconImage", default=None)
    """Signed source project icon image URL"""

    model_slug: str = Field(alias="modelSlug")
    """Source model slug"""

    model_name: str = Field(alias="modelName")
    """Source model name"""


class ModelsRetrieveResponseModel(APIModel):
    id: str = Field(alias="_id")
    """Model ID"""

    username: str | None = Field(default=None)
    """Owner's username"""

    project_id: str | None = Field(alias="projectId", default=None)
    """Parent project ID"""

    project_slug: str | None = Field(alias="projectSlug", default=None)
    """Parent project URL, e.g. `my-project`"""

    slug: str | None = Field(default=None)
    """Model URL, e.g. `my-model` from platform.ultralytics.com/username/my-project/my-model"""

    name: str
    """Display name"""

    description: str | None = Field(default=None)
    """Model description"""

    status: Literal["pending", "untrained", "starting", "running", "completed", "failed", "cancelled"] | None = Field(
        default=None
    )
    """Training/model status"""

    task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"] | None = Field(default=None)
    """YOLO task type"""

    color: str | None = Field(default=None)

    license: (
        Literal[
            "None",
            "Apache-2.0",
            "MIT",
            "BSD-3-Clause",
            "AGPL-3.0",
            "GPL-3.0",
            "LGPL-3.0",
            "MPL-2.0",
            "EUPL-1.1",
            "Unlicense",
            "CC0-1.0",
            "Ultralytics-Enterprise",
            "Other",
        ]
        | None
    ) = Field(default=None)
    """License"""

    dataset_id: str | None = Field(alias="datasetId", default=None)
    """Source dataset ID"""

    dataset_version: ModelsRetrieveResponseModelDatasetVersion | None = Field(alias="datasetVersion", default=None)

    source_model_id: str | None = Field(alias="sourceModelId", default=None)
    """Source model ID"""

    epochs: float | None = Field(default=None)
    """Total epochs"""

    best_epoch: float | None = Field(alias="bestEpoch", default=None)
    """Best epoch number"""

    best_fitness: float | None = Field(alias="bestFitness", default=None)
    """Best fitness score"""

    train_args: ModelsRetrieveResponseModelTrainArgs | None = Field(alias="trainArgs", default=None)
    """Public training configuration; dataset, unknown fields, and local model paths are omitted"""

    version: str | None = Field(default=None)
    """Ultralytics version"""

    docs: str | None = Field(default=None)
    """Model documentation URL"""

    started_at: datetime | None = Field(alias="startedAt", default=None)

    completed_at: datetime | None = Field(alias="completedAt", default=None)

    class_names: list[str] | None = Field(alias="classNames", default=None)

    metrics: dict[str, float] | None = Field(default=None)

    train_results: list[ModelsRetrieveResponseModelTrainResultsItem] | None = Field(alias="trainResults", default=None)

    has_weights: bool = Field(alias="hasWeights")
    """Whether trained or uploaded model weights are available"""

    file: ModelsRetrieveResponseModelFile | None = Field(default=None)
    """Model file size"""

    plots: list[Any] | None = Field(default=None)
    """Validation plots"""

    training_error: ModelsRetrieveResponseModelTrainingError | None = Field(alias="trainingError", default=None)

    star_count: float = Field(alias="starCount")
    """Number of stars"""

    is_starred: bool = Field(alias="isStarred")
    """Whether current user starred this"""

    cloned_from: str | None = Field(alias="clonedFrom", default=None)
    """Source model ID if this is a clone"""

    download_count: float | None = Field(alias="downloadCount", default=None)
    """Download count"""

    clone_count: float | None = Field(alias="cloneCount", default=None)
    """Clone count"""

    created_at: datetime | None = Field(alias="createdAt", default=None)
    """Creation timestamp"""

    updated_at: datetime | None = Field(alias="updatedAt", default=None)
    """Last update timestamp"""

    source_model: ModelsRetrieveResponseModelSourceModel | None = Field(alias="sourceModel", default=None)
    """Linked source model information"""

    base_model: str | None = Field(alias="baseModel", default=None)
    """Root model filename used for training"""

    project_license: (
        Literal[
            "None",
            "Apache-2.0",
            "MIT",
            "BSD-3-Clause",
            "AGPL-3.0",
            "GPL-3.0",
            "LGPL-3.0",
            "MPL-2.0",
            "EUPL-1.1",
            "Unlicense",
            "CC0-1.0",
            "Ultralytics-Enterprise",
            "Other",
        ]
        | None
    ) = Field(alias="projectLicense", default=None)
    """Parent project license"""


class ModelsRetrieveResponseAnalysisCoverage(APIModel):
    mode: Literal["full", "sampled", "tails", "partial", "unavailable"]
    """Row coverage of the validation set: every image (`full`), rank-sampled (`sampled`), legacy extremes only (`tails`), some rows unmatched (`partial`), or no row matched (`unavailable`)"""

    omitted_middle: int = Field(alias="omittedMiddle")
    """Validation images beyond the retained rows"""

    unmatched_extremes: int = Field(alias="unmatchedExtremes")
    """Cohort images without traits"""


class ModelsRetrieveResponseAnalysisScatterSample(APIModel):
    eligible: int
    """Matched rows before the 512-point cap"""

    rows: list[list[Any]]
    """At most 512 evenly-spaced [f1, width, height, pixels, aspectRatio, instanceCount] points"""


class ModelsRetrieveResponseAnalysisCohortsWorstMetricsF1(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisCohortsWorstMetrics(APIModel):
    tp: int
    """Cohort total true positives"""

    fp: int
    """Cohort total false positives"""

    fn: int
    """Cohort total false negatives"""

    f1: ModelsRetrieveResponseAnalysisCohortsWorstMetricsF1
    """Per-image F1 spread; null for an empty cohort"""


class ModelsRetrieveResponseAnalysisCohortsWorstExamplesItemLabelsItem(APIModel):
    class_id: int = Field(alias="classId")
    """Class index (0-based)"""

    bbox: list[Any] | None = Field(default=None)
    """Bounding box [x_center, y_center, width, height] normalized 0-1"""

    segments: list[float] | None = Field(default=None)
    """Segmentation points, normalized 0-1"""

    keypoints: list[float] | None = Field(default=None)
    """Keypoints for pose estimation"""

    obb: list[Any] | None = Field(default=None)
    """Oriented bounding box corners"""

    skeleton_id: str | None = Field(alias="skeletonId", default=None)
    """Skeleton template ID for pose keypoint connections"""


class ModelsRetrieveResponseAnalysisCohortsWorstExamplesItem(APIModel):
    image_id: str | None = Field(alias="imageId", default=None)
    """Current image ID, when the manifest image still exists in the dataset"""

    hash: str
    """Image content hash retained by the immutable validation manifest"""

    tp: int
    """True positive detections at IoU 0.50"""

    fp: int
    """False positive detections at IoU 0.50"""

    fn: int
    """False negative (missed) ground-truth instances at IoU 0.50"""

    f1: float
    """Per-image F1 at IoU 0.50; 1 for a correctly empty image"""

    is_empty_ground_truth: bool = Field(alias="isEmptyGroundTruth")
    """True when the image has no ground-truth labels"""

    width: float | None = Field(default=None)
    """Image width in pixels; the six trait fields are all present or all absent"""

    height: float | None = Field(default=None)
    """Image height in pixels"""

    pixels: float | None = Field(default=None)
    """Image area in pixels"""

    aspect_ratio: float | None = Field(alias="aspectRatio", default=None)
    """Width divided by height"""

    instance_count: int | None = Field(alias="instanceCount", default=None)
    """Ground-truth instances, which may exceed `labels` length"""

    labels: list[ModelsRetrieveResponseAnalysisCohortsWorstExamplesItemLabelsItem] | None = Field(default=None)
    """Ground-truth annotations, capped at 100 with polygons decimated to 100 points"""


class ModelsRetrieveResponseAnalysisCohortsWorst(APIModel):
    count: int
    """Images in the cohort; only the first 100 appear in `examples`"""

    matched: int
    """Cohort images with traits"""

    metrics: ModelsRetrieveResponseAnalysisCohortsWorstMetrics
    """Whole-cohort totals, not just `examples`, at a confidence threshold the run did not record"""

    examples: list[ModelsRetrieveResponseAnalysisCohortsWorstExamplesItem]
    """Cohort images ordered by F1, extreme first"""


class ModelsRetrieveResponseAnalysisCohortsBestMetricsF1(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisCohortsBestMetrics(APIModel):
    tp: int
    """Cohort total true positives"""

    fp: int
    """Cohort total false positives"""

    fn: int
    """Cohort total false negatives"""

    f1: ModelsRetrieveResponseAnalysisCohortsBestMetricsF1
    """Per-image F1 spread; null for an empty cohort"""


class ModelsRetrieveResponseAnalysisCohortsBestExamplesItemLabelsItem(APIModel):
    class_id: int = Field(alias="classId")
    """Class index (0-based)"""

    bbox: list[Any] | None = Field(default=None)
    """Bounding box [x_center, y_center, width, height] normalized 0-1"""

    segments: list[float] | None = Field(default=None)
    """Segmentation points, normalized 0-1"""

    keypoints: list[float] | None = Field(default=None)
    """Keypoints for pose estimation"""

    obb: list[Any] | None = Field(default=None)
    """Oriented bounding box corners"""

    skeleton_id: str | None = Field(alias="skeletonId", default=None)
    """Skeleton template ID for pose keypoint connections"""


class ModelsRetrieveResponseAnalysisCohortsBestExamplesItem(APIModel):
    image_id: str | None = Field(alias="imageId", default=None)
    """Current image ID, when the manifest image still exists in the dataset"""

    hash: str
    """Image content hash retained by the immutable validation manifest"""

    tp: int
    """True positive detections at IoU 0.50"""

    fp: int
    """False positive detections at IoU 0.50"""

    fn: int
    """False negative (missed) ground-truth instances at IoU 0.50"""

    f1: float
    """Per-image F1 at IoU 0.50; 1 for a correctly empty image"""

    is_empty_ground_truth: bool = Field(alias="isEmptyGroundTruth")
    """True when the image has no ground-truth labels"""

    width: float | None = Field(default=None)
    """Image width in pixels; the six trait fields are all present or all absent"""

    height: float | None = Field(default=None)
    """Image height in pixels"""

    pixels: float | None = Field(default=None)
    """Image area in pixels"""

    aspect_ratio: float | None = Field(alias="aspectRatio", default=None)
    """Width divided by height"""

    instance_count: int | None = Field(alias="instanceCount", default=None)
    """Ground-truth instances, which may exceed `labels` length"""

    labels: list[ModelsRetrieveResponseAnalysisCohortsBestExamplesItemLabelsItem] | None = Field(default=None)
    """Ground-truth annotations, capped at 100 with polygons decimated to 100 points"""


class ModelsRetrieveResponseAnalysisCohortsBest(APIModel):
    count: int
    """Images in the cohort; only the first 100 appear in `examples`"""

    matched: int
    """Cohort images with traits"""

    metrics: ModelsRetrieveResponseAnalysisCohortsBestMetrics
    """Whole-cohort totals, not just `examples`, at a confidence threshold the run did not record"""

    examples: list[ModelsRetrieveResponseAnalysisCohortsBestExamplesItem]
    """Cohort images ordered by F1, extreme first"""


class ModelsRetrieveResponseAnalysisCohorts(APIModel):
    worst: ModelsRetrieveResponseAnalysisCohortsWorst
    """Validation cohort (worst or best images by F1)"""

    best: ModelsRetrieveResponseAnalysisCohortsBest
    """Validation cohort (worst or best images by F1)"""


class ModelsRetrieveResponseAnalysisComparisonsWidthWorst(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsWidthBest(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsWidthRelationshipFit(APIModel):
    slope: float

    intercept: float

    pearson_r: float = Field(alias="pearsonR")

    r_squared: float = Field(alias="rSquared")


class ModelsRetrieveResponseAnalysisComparisonsWidthRelationshipCovariance(APIModel):
    mean: list[Any]
    """[trait mean, F1 mean]"""

    eigenvalues: list[Any]
    """[major, minor], descending"""

    eigenvectors: list[Any]
    """[major axis, perpendicular axis], each a unit [trait, F1] vector"""


class ModelsRetrieveResponseAnalysisComparisonsWidthRelationship(APIModel):
    count: int
    """Matched trait/F1 pairs behind the fit"""

    fit: ModelsRetrieveResponseAnalysisComparisonsWidthRelationshipFit
    """Least-squares fit of F1 (y) on the trait (x); null unless coverage is full or sampled, with 2+ varying pairs"""

    covariance: ModelsRetrieveResponseAnalysisComparisonsWidthRelationshipCovariance
    """Covariance of the trait-F1 cloud; null whenever `fit` is"""


class ModelsRetrieveResponseAnalysisComparisonsWidth(APIModel):
    worst: ModelsRetrieveResponseAnalysisComparisonsWidthWorst
    """Trait spread across the matched worst cohort"""

    best: ModelsRetrieveResponseAnalysisComparisonsWidthBest
    """Trait spread across the matched best cohort"""

    relationship: ModelsRetrieveResponseAnalysisComparisonsWidthRelationship


class ModelsRetrieveResponseAnalysisComparisonsHeightWorst(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsHeightBest(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsHeightRelationshipFit(APIModel):
    slope: float

    intercept: float

    pearson_r: float = Field(alias="pearsonR")

    r_squared: float = Field(alias="rSquared")


class ModelsRetrieveResponseAnalysisComparisonsHeightRelationshipCovariance(APIModel):
    mean: list[Any]
    """[trait mean, F1 mean]"""

    eigenvalues: list[Any]
    """[major, minor], descending"""

    eigenvectors: list[Any]
    """[major axis, perpendicular axis], each a unit [trait, F1] vector"""


class ModelsRetrieveResponseAnalysisComparisonsHeightRelationship(APIModel):
    count: int
    """Matched trait/F1 pairs behind the fit"""

    fit: ModelsRetrieveResponseAnalysisComparisonsHeightRelationshipFit
    """Least-squares fit of F1 (y) on the trait (x); null unless coverage is full or sampled, with 2+ varying pairs"""

    covariance: ModelsRetrieveResponseAnalysisComparisonsHeightRelationshipCovariance
    """Covariance of the trait-F1 cloud; null whenever `fit` is"""


class ModelsRetrieveResponseAnalysisComparisonsHeight(APIModel):
    worst: ModelsRetrieveResponseAnalysisComparisonsHeightWorst
    """Trait spread across the matched worst cohort"""

    best: ModelsRetrieveResponseAnalysisComparisonsHeightBest
    """Trait spread across the matched best cohort"""

    relationship: ModelsRetrieveResponseAnalysisComparisonsHeightRelationship


class ModelsRetrieveResponseAnalysisComparisonsPixelsWorst(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsPixelsBest(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsPixelsRelationshipFit(APIModel):
    slope: float

    intercept: float

    pearson_r: float = Field(alias="pearsonR")

    r_squared: float = Field(alias="rSquared")


class ModelsRetrieveResponseAnalysisComparisonsPixelsRelationshipCovariance(APIModel):
    mean: list[Any]
    """[trait mean, F1 mean]"""

    eigenvalues: list[Any]
    """[major, minor], descending"""

    eigenvectors: list[Any]
    """[major axis, perpendicular axis], each a unit [trait, F1] vector"""


class ModelsRetrieveResponseAnalysisComparisonsPixelsRelationship(APIModel):
    count: int
    """Matched trait/F1 pairs behind the fit"""

    fit: ModelsRetrieveResponseAnalysisComparisonsPixelsRelationshipFit
    """Least-squares fit of F1 (y) on the trait (x); null unless coverage is full or sampled, with 2+ varying pairs"""

    covariance: ModelsRetrieveResponseAnalysisComparisonsPixelsRelationshipCovariance
    """Covariance of the trait-F1 cloud; null whenever `fit` is"""


class ModelsRetrieveResponseAnalysisComparisonsPixels(APIModel):
    worst: ModelsRetrieveResponseAnalysisComparisonsPixelsWorst
    """Trait spread across the matched worst cohort"""

    best: ModelsRetrieveResponseAnalysisComparisonsPixelsBest
    """Trait spread across the matched best cohort"""

    relationship: ModelsRetrieveResponseAnalysisComparisonsPixelsRelationship


class ModelsRetrieveResponseAnalysisComparisonsAspectRatioWorst(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsAspectRatioBest(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsAspectRatioRelationshipFit(APIModel):
    slope: float

    intercept: float

    pearson_r: float = Field(alias="pearsonR")

    r_squared: float = Field(alias="rSquared")


class ModelsRetrieveResponseAnalysisComparisonsAspectRatioRelationshipCovariance(APIModel):
    mean: list[Any]
    """[trait mean, F1 mean]"""

    eigenvalues: list[Any]
    """[major, minor], descending"""

    eigenvectors: list[Any]
    """[major axis, perpendicular axis], each a unit [trait, F1] vector"""


class ModelsRetrieveResponseAnalysisComparisonsAspectRatioRelationship(APIModel):
    count: int
    """Matched trait/F1 pairs behind the fit"""

    fit: ModelsRetrieveResponseAnalysisComparisonsAspectRatioRelationshipFit
    """Least-squares fit of F1 (y) on the trait (x); null unless coverage is full or sampled, with 2+ varying pairs"""

    covariance: ModelsRetrieveResponseAnalysisComparisonsAspectRatioRelationshipCovariance
    """Covariance of the trait-F1 cloud; null whenever `fit` is"""


class ModelsRetrieveResponseAnalysisComparisonsAspectRatio(APIModel):
    worst: ModelsRetrieveResponseAnalysisComparisonsAspectRatioWorst
    """Trait spread across the matched worst cohort"""

    best: ModelsRetrieveResponseAnalysisComparisonsAspectRatioBest
    """Trait spread across the matched best cohort"""

    relationship: ModelsRetrieveResponseAnalysisComparisonsAspectRatioRelationship


class ModelsRetrieveResponseAnalysisComparisonsInstanceCountWorst(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsInstanceCountBest(APIModel):
    count: int
    """Number of values in the series"""

    min: float

    p25: float
    """25th percentile, interpolated"""

    median: float

    p75: float
    """75th percentile, interpolated"""

    max: float

    mean: float


class ModelsRetrieveResponseAnalysisComparisonsInstanceCountRelationshipFit(APIModel):
    slope: float

    intercept: float

    pearson_r: float = Field(alias="pearsonR")

    r_squared: float = Field(alias="rSquared")


class ModelsRetrieveResponseAnalysisComparisonsInstanceCountRelationshipCovariance(APIModel):
    mean: list[Any]
    """[trait mean, F1 mean]"""

    eigenvalues: list[Any]
    """[major, minor], descending"""

    eigenvectors: list[Any]
    """[major axis, perpendicular axis], each a unit [trait, F1] vector"""


class ModelsRetrieveResponseAnalysisComparisonsInstanceCountRelationship(APIModel):
    count: int
    """Matched trait/F1 pairs behind the fit"""

    fit: ModelsRetrieveResponseAnalysisComparisonsInstanceCountRelationshipFit
    """Least-squares fit of F1 (y) on the trait (x); null unless coverage is full or sampled, with 2+ varying pairs"""

    covariance: ModelsRetrieveResponseAnalysisComparisonsInstanceCountRelationshipCovariance
    """Covariance of the trait-F1 cloud; null whenever `fit` is"""


class ModelsRetrieveResponseAnalysisComparisonsInstanceCount(APIModel):
    worst: ModelsRetrieveResponseAnalysisComparisonsInstanceCountWorst
    """Trait spread across the matched worst cohort"""

    best: ModelsRetrieveResponseAnalysisComparisonsInstanceCountBest
    """Trait spread across the matched best cohort"""

    relationship: ModelsRetrieveResponseAnalysisComparisonsInstanceCountRelationship


class ModelsRetrieveResponseAnalysisComparisonsClassPresenceItemWorst(APIModel):
    count: int
    """Matched worst-cohort images containing the class"""

    prevalence: float
    """`count` divided by `cohorts.worst.matched`"""


class ModelsRetrieveResponseAnalysisComparisonsClassPresenceItemBest(APIModel):
    count: int
    """Matched best-cohort images containing the class"""

    prevalence: float
    """`count` divided by `cohorts.best.matched`"""


class ModelsRetrieveResponseAnalysisComparisonsClassPresenceItem(APIModel):
    class_id: int = Field(alias="classId")
    """Class index"""

    name: str
    """Manifest class name, or `class {id}` when unnamed"""

    worst: ModelsRetrieveResponseAnalysisComparisonsClassPresenceItemWorst

    best: ModelsRetrieveResponseAnalysisComparisonsClassPresenceItemBest

    prevalence_difference: float = Field(alias="prevalenceDifference")
    """Worst-cohort prevalence minus best-cohort prevalence"""


class ModelsRetrieveResponseAnalysisComparisons(APIModel):
    width: ModelsRetrieveResponseAnalysisComparisonsWidth
    """How an image trait differs between the worst and best cohorts"""

    height: ModelsRetrieveResponseAnalysisComparisonsHeight
    """How an image trait differs between the worst and best cohorts"""

    pixels: ModelsRetrieveResponseAnalysisComparisonsPixels
    """How an image trait differs between the worst and best cohorts"""

    aspect_ratio: ModelsRetrieveResponseAnalysisComparisonsAspectRatio = Field(alias="aspectRatio")
    """How an image trait differs between the worst and best cohorts"""

    instance_count: ModelsRetrieveResponseAnalysisComparisonsInstanceCount = Field(alias="instanceCount")
    """How an image trait differs between the worst and best cohorts"""

    class_presence: list[ModelsRetrieveResponseAnalysisComparisonsClassPresenceItem] = Field(alias="classPresence")
    """Ranked by absolute prevalence difference, capped at 500; empty when any cohort image lacks traits"""

    class_presence_truncated: bool = Field(alias="classPresenceTruncated")
    """True when more than 500 classes were found"""


class ModelsRetrieveResponseAnalysis(APIModel):
    population: int
    """Validation images evaluated during training"""

    retained: int
    """Per-image rows stored; min(population, 5000) when F1-rank sampled"""

    matched: int
    """Retained rows with traits"""

    unmatched: int
    """Retained rows without traits"""

    traits_available: bool = Field(alias="traitsAvailable")
    """Whether any retained row has traits; gates `comparisons`. Cohort examples may have traits when false"""

    source_split: Literal["train", "val"] | None = Field(alias="sourceSplit")
    """Manifest split the traits came from; null when the dataset version or its region is unresolved"""

    coverage: ModelsRetrieveResponseAnalysisCoverage

    scatter_sample: ModelsRetrieveResponseAnalysisScatterSample = Field(alias="scatterSample")

    cohorts: ModelsRetrieveResponseAnalysisCohorts

    comparisons: ModelsRetrieveResponseAnalysisComparisons
    """Trait-vs-F1 comparisons; null when no traits were read — unreadable dataset, missing manifest, a manifest with no `detect` header, or no matching row"""


class ModelsRetrieveResponse(APIModel):
    model: ModelsRetrieveResponseModel | None = Field(default=None)
    """Model detail"""

    is_owner: bool | None = Field(alias="isOwner", default=None)
    """Whether the current user owns the model"""

    analysis: ModelsRetrieveResponseAnalysis | None = Field(default=None)
    """null unless the run is a completed detect training with a stored per-image result"""


class ModelsUpdateResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class ModelsDeleteResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class ModelsRetrieveMetadataResponse(APIModel):
    metadata: dict[str, Any]
    """Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters."""

    properties: list[list[Any]]
    """Ultralytics-managed field and value pairs"""


class ModelsCloneResponse(APIModel):
    model_id: str = Field(alias="modelId")
    """Cloned model ID"""

    model_slug: str = Field(alias="modelSlug")
    """Cloned model slug"""

    model_name: str = Field(alias="modelName")
    """Cloned model name"""

    project_id: str = Field(alias="projectId")
    """Target project ID"""

    project_slug: str = Field(alias="projectSlug")
    """Target project slug"""

    project_name: str = Field(alias="projectName")
    """Target project name"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class ModelsRetrieveFilesResponseFilesItem(APIModel):
    name: str

    size: float | None = Field(default=None)

    download_url: str = Field(alias="downloadUrl")


class ModelsRetrieveFilesResponse(APIModel):
    files: list[ModelsRetrieveFilesResponseFilesItem]


class ModelsPredictResponseImagesItemSemanticMask(APIModel):
    shape: list[float]

    encoding: Literal["png"]

    data: str


class ModelsPredictResponseImagesItemDepth(APIModel):
    shape: list[float]

    encoding: Literal["png"]

    data: str

    min: float

    max: float

    bits: Literal[8, 12, 16]
    """Depth quantization: 8 = uint8 PNG (divisor 255), 12/16 = uint16 PNG (divisor 65535)"""


class ModelsPredictResponseImagesItem(APIModel):
    shape: list[float]

    speed: dict[str, float]

    results: list[Any]

    semantic_mask: ModelsPredictResponseImagesItemSemanticMask | None = Field(default=None)

    depth: ModelsPredictResponseImagesItemDepth | None = Field(default=None)


class ModelsPredictResponseMetadata(APIModel):
    image_count: int = Field(alias="imageCount")

    function_time_alive: float = Field(alias="functionTimeAlive")

    function_time_call: float = Field(alias="functionTimeCall")

    task: str | None

    version: dict[str, str]


class ModelsPredictResponse(APIModel):
    images: list[ModelsPredictResponseImagesItem]

    metadata: ModelsPredictResponseMetadata


class ModelsRetrieveTrainingResponseJobProgress(APIModel):
    current_epoch: float = Field(alias="currentEpoch")

    total_epochs: float = Field(alias="totalEpochs")

    started_at: datetime | None = Field(alias="startedAt", default=None)

    completed_at: datetime | None = Field(alias="completedAt", default=None)

    percentage: float


class ModelsRetrieveTrainingResponseJobTiming(APIModel):
    elapsed_ms: float = Field(alias="elapsedMs")

    time_per_epoch_ms: float = Field(alias="timePerEpochMs")

    eta_ms: float = Field(alias="etaMs")


class ModelsRetrieveTrainingResponseJobCompute(APIModel):
    gpu_type: str = Field(alias="gpuType")

    gpu_display_name: str = Field(alias="gpuDisplayName")

    gpu_memory_gb: float = Field(alias="gpuMemoryGb")


class ModelsRetrieveTrainingResponseJobTrainArgs(APIModel):
    model: str | None = Field(default=None)

    epochs: float | None = Field(default=None)

    batch: float | None = Field(default=None)

    imgsz: float | None = Field(default=None)


class ModelsRetrieveTrainingResponseJob(APIModel):
    id: str

    status: Literal["pending", "untrained", "starting", "running", "completed", "failed", "cancelled"]
    """Training/model status"""

    progress: ModelsRetrieveTrainingResponseJobProgress

    timing: ModelsRetrieveTrainingResponseJobTiming

    compute: ModelsRetrieveTrainingResponseJobCompute

    train_args: ModelsRetrieveTrainingResponseJobTrainArgs = Field(alias="trainArgs")

    epoch_metrics: dict[str, Any] | None = Field(alias="epochMetrics")

    error: Any | None

    created_at: datetime = Field(alias="createdAt")

    updated_at: datetime = Field(alias="updatedAt")


class ModelsRetrieveTrainingResponseInstanceStatus(APIModel):
    status: str


class ModelsRetrieveTrainingResponse(APIModel):
    job: ModelsRetrieveTrainingResponseJob

    instance_status: ModelsRetrieveTrainingResponseInstanceStatus | None = Field(alias="instanceStatus", default=None)


class ModelsDeleteTrainingResponse(APIModel):
    success: Literal[True]

    status: Literal["cancelled"]

    warning: str | None = Field(default=None)
    """Present if the compute instance could not be terminated cleanly"""


class ModelsTrackDownloadResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class TrainingStartResponseEstimatedCost(APIModel):
    price_per_hour: float = Field(alias="pricePerHour")
    """GPU price per hour in USD"""

    gpu_memory_gb: float = Field(alias="gpuMemoryGb")
    """GPU memory in GB"""


class TrainingStartResponseBilling(APIModel):
    estimated_cost_cents: float = Field(alias="estimatedCostCents")
    """Estimated total cost in cents"""

    estimated_cost_display: str = Field(alias="estimatedCostDisplay")
    """Formatted cost string"""

    balance_cents: float = Field(alias="balanceCents")
    """Current balance in cents"""


class TrainingStartResponse(APIModel):
    model_id: str = Field(alias="modelId")
    """Model ID for tracking"""

    status: Literal["starting"]
    """Initial status"""

    gpu_type: str = Field(alias="gpuType")
    """GPU type used"""

    estimated_cost: TrainingStartResponseEstimatedCost = Field(alias="estimatedCost")

    billing: TrainingStartResponseBilling


class ExportsListResponseExportsItemFile(APIModel):
    size: float | None = Field(default=None)
    """File size in bytes"""

    download_url: str | None = Field(alias="downloadUrl", default=None)
    """Signed download URL"""

    download_filename: str | None = Field(alias="downloadFilename", default=None)
    """Suggested download filename"""


class ExportsListResponseExportsItemError(APIModel):
    message: str

    timestamp: datetime


class ExportsListResponseExportsItem(APIModel):
    id: str = Field(alias="_id")
    """Export job ID"""

    model_id: str = Field(alias="modelId")
    """Source model ID"""

    project_id: str = Field(alias="projectId")
    """Parent project ID"""

    status: Literal["queued", "starting", "running", "completed", "failed", "cancelled"]
    """Export status"""

    format: Literal[
        "onnx",
        "torchscript",
        "openvino",
        "engine",
        "coreml",
        "litert",
        "pb",
        "saved_model",
        "paddle",
        "ncnn",
        "edgetpu",
        "mnn",
        "rknn",
        "qnn",
        "imx",
        "axelera",
        "executorch",
        "deepx",
        "hailo",
        "ascend",
    ]
    """Export format"""

    args: dict[str, Any] | None = Field(default=None)
    """Export arguments"""

    gpu_type: str | None = Field(alias="gpuType", default=None)
    """GPU type used"""

    file: ExportsListResponseExportsItemFile | None = Field(default=None)
    """Export file info"""

    error: ExportsListResponseExportsItemError | None = Field(default=None)
    """Client-safe export failure info"""

    started_at: datetime | None = Field(alias="startedAt", default=None)

    completed_at: datetime | None = Field(alias="completedAt", default=None)

    created_at: datetime = Field(alias="createdAt")

    updated_at: datetime = Field(alias="updatedAt")


class ExportsListResponse(APIModel):
    exports: list[ExportsListResponseExportsItem]

    region: Literal["us", "eu", "ap"]
    """Data region"""


class ExportsCreateResponse(APIModel):
    export_id: str = Field(alias="exportId")
    """Export job ID"""

    format: Literal[
        "onnx",
        "torchscript",
        "openvino",
        "engine",
        "coreml",
        "litert",
        "pb",
        "saved_model",
        "paddle",
        "ncnn",
        "edgetpu",
        "mnn",
        "rknn",
        "qnn",
        "imx",
        "axelera",
        "executorch",
        "deepx",
        "hailo",
        "ascend",
    ]
    """Export format"""

    status: Literal["queued", "running"]
    """Initial status"""

    gpu_type: str | None = Field(alias="gpuType", default=None)

    region: Literal["us", "eu", "ap"]
    """Data region"""


class ExportsRetrieveResponseExportFile(APIModel):
    size: float | None = Field(default=None)
    """File size in bytes"""

    download_url: str | None = Field(alias="downloadUrl", default=None)
    """Signed download URL"""

    download_filename: str | None = Field(alias="downloadFilename", default=None)
    """Suggested download filename"""


class ExportsRetrieveResponseExportError(APIModel):
    message: str

    timestamp: datetime


class ExportsRetrieveResponseExport(APIModel):
    id: str = Field(alias="_id")
    """Export job ID"""

    model_id: str = Field(alias="modelId")
    """Source model ID"""

    project_id: str = Field(alias="projectId")
    """Parent project ID"""

    status: Literal["queued", "starting", "running", "completed", "failed", "cancelled"]
    """Export status"""

    format: Literal[
        "onnx",
        "torchscript",
        "openvino",
        "engine",
        "coreml",
        "litert",
        "pb",
        "saved_model",
        "paddle",
        "ncnn",
        "edgetpu",
        "mnn",
        "rknn",
        "qnn",
        "imx",
        "axelera",
        "executorch",
        "deepx",
        "hailo",
        "ascend",
    ]
    """Export format"""

    args: dict[str, Any] | None = Field(default=None)
    """Export arguments"""

    gpu_type: str | None = Field(alias="gpuType", default=None)
    """GPU type used"""

    file: ExportsRetrieveResponseExportFile | None = Field(default=None)
    """Export file info"""

    error: ExportsRetrieveResponseExportError | None = Field(default=None)
    """Client-safe export failure info"""

    started_at: datetime | None = Field(alias="startedAt", default=None)

    completed_at: datetime | None = Field(alias="completedAt", default=None)

    created_at: datetime = Field(alias="createdAt")

    updated_at: datetime = Field(alias="updatedAt")


class ExportsRetrieveResponse(APIModel):
    export: ExportsRetrieveResponseExport
    """Export job"""


class ExportsDeleteResponse(APIModel):
    success: Literal[True]

    action: Literal["cancelled", "deleted"]


class ExportsTrackDownloadResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class DeploymentsListResponseDeploymentsItemResources(APIModel):
    cpu: float
    """CPU cores (1-8)"""

    memory_gi: float = Field(alias="memoryGi")
    """Memory in GiB (1-32)"""

    min_instances: float = Field(alias="minInstances")
    """Minimum instances (0 for scale-to-zero)"""

    max_instances: float = Field(alias="maxInstances")
    """Maximum instances"""


class DeploymentsListResponseDeploymentsItem(APIModel):
    id: str = Field(alias="_id")
    """Deployment ID"""

    username: str
    """Owner's username"""

    model_id: str = Field(alias="modelId")
    """Source model ID"""

    project_id: str = Field(alias="projectId")
    """Parent project ID"""

    name: str
    """Deployment name"""

    slug: str
    """Deployment URL, e.g. `my-endpoint`"""

    status: Literal["creating", "deploying", "ready", "stopping", "stopped", "failed"]
    """Deployment status"""

    status_message: str | None = Field(alias="statusMessage", default=None)
    """Status details"""

    region: str
    """Deployment region"""

    service_url: str | None = Field(alias="serviceUrl", default=None)
    """Deployment service URL"""

    resources: DeploymentsListResponseDeploymentsItemResources
    """Managed endpoint resource configuration"""

    deployed_at: datetime | None = Field(alias="deployedAt", default=None)
    """When deployment became ready"""

    created_at: datetime = Field(alias="createdAt")
    """Creation timestamp"""

    updated_at: datetime = Field(alias="updatedAt")
    """Last update timestamp"""


class DeploymentsListResponse(APIModel):
    deployments: list[DeploymentsListResponseDeploymentsItem]

    total: float
    """Total matching deployments"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class DeploymentsCreateResponse(APIModel):
    deployment_id: str = Field(alias="deploymentId")
    """Created deployment ID"""

    status: Literal["creating"]
    """Initial status"""

    message: str
    """Status message"""

    region: str
    """Deployment region"""


class DeploymentsRetrieveResponseDeploymentResources(APIModel):
    cpu: float
    """CPU cores (1-8)"""

    memory_gi: float = Field(alias="memoryGi")
    """Memory in GiB (1-32)"""

    min_instances: float = Field(alias="minInstances")
    """Minimum instances (0 for scale-to-zero)"""

    max_instances: float = Field(alias="maxInstances")
    """Maximum instances"""


class DeploymentsRetrieveResponseDeployment(APIModel):
    id: str = Field(alias="_id")
    """Deployment ID"""

    username: str
    """Owner's username"""

    model_id: str = Field(alias="modelId")
    """Source model ID"""

    project_id: str = Field(alias="projectId")
    """Parent project ID"""

    name: str
    """Deployment name"""

    slug: str
    """Deployment URL, e.g. `my-endpoint`"""

    status: Literal["creating", "deploying", "ready", "stopping", "stopped", "failed"]
    """Deployment status"""

    status_message: str | None = Field(alias="statusMessage", default=None)
    """Status details"""

    region: str
    """Deployment region"""

    service_url: str | None = Field(alias="serviceUrl", default=None)
    """Deployment service URL"""

    resources: DeploymentsRetrieveResponseDeploymentResources
    """Managed endpoint resource configuration"""

    deployed_at: datetime | None = Field(alias="deployedAt", default=None)
    """When deployment became ready"""

    created_at: datetime = Field(alias="createdAt")
    """Creation timestamp"""

    updated_at: datetime = Field(alias="updatedAt")
    """Last update timestamp"""


class DeploymentsRetrieveResponse(APIModel):
    deployment: DeploymentsRetrieveResponseDeployment
    """Deployment summary"""

    region: Literal["us", "eu", "ap"]
    """Data region"""


class DeploymentsUpdateResponse(APIModel):
    success: Literal[True]

    status: Literal["ready"]

    message: str


class DeploymentsDeleteResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class DeploymentsPredictResponseImagesItemSemanticMask(APIModel):
    shape: list[float]

    encoding: Literal["png"]

    data: str


class DeploymentsPredictResponseImagesItemDepth(APIModel):
    shape: list[float]

    encoding: Literal["png"]

    data: str

    min: float

    max: float

    bits: Literal[8, 12, 16]
    """Depth quantization: 8 = uint8 PNG (divisor 255), 12/16 = uint16 PNG (divisor 65535)"""


class DeploymentsPredictResponseImagesItem(APIModel):
    shape: list[float]

    speed: dict[str, float]

    results: list[Any]

    semantic_mask: DeploymentsPredictResponseImagesItemSemanticMask | None = Field(default=None)

    depth: DeploymentsPredictResponseImagesItemDepth | None = Field(default=None)


class DeploymentsPredictResponseMetadata(APIModel):
    image_count: int = Field(alias="imageCount")

    function_time_alive: float = Field(alias="functionTimeAlive")

    function_time_call: float = Field(alias="functionTimeCall")

    task: str | None

    version: dict[str, str]


class DeploymentsPredictResponse(APIModel):
    images: list[DeploymentsPredictResponseImagesItem]

    metadata: DeploymentsPredictResponseMetadata


class DeploymentsRetrieveHealthResponse(APIModel):
    healthy: bool
    """Whether the deployment responded successfully"""

    status: float | None = Field(default=None)
    """HTTP status code from the health endpoint"""

    latency_ms: float = Field(alias="latencyMs")
    """Round-trip latency in milliseconds"""

    error: str | None = Field(default=None)
    """Error message when health check fails"""


class DeploymentsRetrieveMetricsResponseTimeRange(APIModel):
    start: str
    """Start time ISO"""

    end: str
    """End time ISO"""


class DeploymentsRetrieveMetricsResponseSummary(APIModel):
    total_requests: float = Field(alias="totalRequests")
    """Total requests in time range"""

    error_count: float = Field(alias="errorCount")
    """Total errors (4xx + 5xx)"""

    error_rate: float = Field(alias="errorRate")
    """Error rate percentage"""

    avg_latency_ms: float = Field(alias="avgLatencyMs")
    """Average latency in milliseconds"""

    p50_latency_ms: float = Field(alias="p50LatencyMs")
    """50th percentile latency"""

    p95_latency_ms: float = Field(alias="p95LatencyMs")
    """95th percentile latency"""

    p99_latency_ms: float = Field(alias="p99LatencyMs")
    """99th percentile latency"""


class DeploymentsRetrieveMetricsResponseTimeSeriesRequestsItem(APIModel):
    timestamp: str
    """ISO timestamp"""

    value: float
    """Metric value"""


class DeploymentsRetrieveMetricsResponseTimeSeriesErrorsItem(APIModel):
    timestamp: str
    """ISO timestamp"""

    value: float
    """Metric value"""


class DeploymentsRetrieveMetricsResponseTimeSeriesLatencyP50Item(APIModel):
    timestamp: str
    """ISO timestamp"""

    value: float
    """Metric value"""


class DeploymentsRetrieveMetricsResponseTimeSeriesLatencyP95Item(APIModel):
    timestamp: str
    """ISO timestamp"""

    value: float
    """Metric value"""


class DeploymentsRetrieveMetricsResponseTimeSeriesCpuUtilizationItem(APIModel):
    timestamp: str
    """ISO timestamp"""

    value: float
    """Metric value"""


class DeploymentsRetrieveMetricsResponseTimeSeriesMemoryUtilizationItem(APIModel):
    timestamp: str
    """ISO timestamp"""

    value: float
    """Metric value"""


class DeploymentsRetrieveMetricsResponseTimeSeriesInstanceCountItem(APIModel):
    timestamp: str
    """ISO timestamp"""

    value: float
    """Metric value"""


class DeploymentsRetrieveMetricsResponseTimeSeries(APIModel):
    requests: list[DeploymentsRetrieveMetricsResponseTimeSeriesRequestsItem]
    """Request count per interval"""

    errors: list[DeploymentsRetrieveMetricsResponseTimeSeriesErrorsItem]
    """Error count per interval"""

    latency_p50: list[DeploymentsRetrieveMetricsResponseTimeSeriesLatencyP50Item] = Field(alias="latencyP50")
    """P50 latency per interval"""

    latency_p95: list[DeploymentsRetrieveMetricsResponseTimeSeriesLatencyP95Item] = Field(alias="latencyP95")
    """P95 latency per interval"""

    cpu_utilization: list[DeploymentsRetrieveMetricsResponseTimeSeriesCpuUtilizationItem] = Field(
        alias="cpuUtilization"
    )
    """CPU utilization % per interval"""

    memory_utilization: list[DeploymentsRetrieveMetricsResponseTimeSeriesMemoryUtilizationItem] = Field(
        alias="memoryUtilization"
    )
    """Memory utilization % per interval"""

    instance_count: list[DeploymentsRetrieveMetricsResponseTimeSeriesInstanceCountItem] = Field(alias="instanceCount")
    """Active instances per interval"""


class DeploymentsRetrieveMetricsResponse(APIModel):
    deployment_id: str | None = Field(alias="deploymentId", default=None)
    """Deployment ID"""

    region: str | None = Field(default=None)
    """Cloud Run region"""

    time_range: DeploymentsRetrieveMetricsResponseTimeRange | None = Field(alias="timeRange", default=None)
    """Query time range"""

    summary: DeploymentsRetrieveMetricsResponseSummary | None = Field(default=None)
    """Metrics summary statistics"""

    time_series: DeploymentsRetrieveMetricsResponseTimeSeries | None = Field(alias="timeSeries", default=None)
    """Time series data"""

    requests24h: list[float] | None = Field(default=None)
    """Hourly request counts for last 24h"""

    total_requests: float | None = Field(alias="totalRequests", default=None)
    """Total requests in 24h"""

    error_rate: float | None = Field(alias="errorRate", default=None)
    """Error rate percentage"""

    avg_latency_ms: float | None = Field(alias="avgLatencyMs", default=None)
    """Average latency in milliseconds"""


class DeploymentsRetrieveLogsResponseEntriesItemHttpRequest(APIModel):
    method: str
    """HTTP method"""

    url: str
    """Request URL"""

    status: float
    """HTTP status code"""

    latency_ms: float = Field(alias="latencyMs")
    """Request latency in ms"""

    user_agent: str | None = Field(alias="userAgent", default=None)
    """User agent string"""


class DeploymentsRetrieveLogsResponseEntriesItem(APIModel):
    timestamp: str
    """Log timestamp ISO"""

    severity: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL", "DEFAULT"]
    """Log entry severity level"""

    message: str
    """Log message"""

    http_request: DeploymentsRetrieveLogsResponseEntriesItemHttpRequest | None = Field(
        alias="httpRequest", default=None
    )
    """HTTP request details"""


class DeploymentsRetrieveLogsResponse(APIModel):
    entries: list[DeploymentsRetrieveLogsResponseEntriesItem]
    """Log entries"""

    next_page_token: str | None = Field(alias="nextPageToken", default=None)
    """Token for next page"""


class DeploymentsStartResponse(APIModel):
    success: Literal[True]

    status: Literal["ready", "stopped"]

    message: str


class DeploymentsStopResponse(APIModel):
    success: Literal[True]

    status: Literal["ready", "stopped"]

    message: str


class AccountRetrieveSummaryResponseCounts(APIModel):
    projects: int

    datasets: int

    models: int


class AccountRetrieveSummaryResponseTeamsItem(APIModel):
    username: str

    full_name: str | None = Field(alias="fullName", default=None)

    role: str


class AccountRetrieveSummaryResponse(APIModel):
    username: str

    name: str

    account_type: Literal["personal", "team"] = Field(alias="accountType")

    plan: Literal["free", "pro", "enterprise"]
    """User tier"""

    credits_cents: int = Field(alias="creditsCents")

    counts: AccountRetrieveSummaryResponseCounts

    teams: list[AccountRetrieveSummaryResponseTeamsItem]


class AccountListApiKeysResponseKeysItem(APIModel):
    key_id: str = Field(alias="keyId")
    """Key ID"""

    name: str
    """Key name"""

    key_prefix: str = Field(alias="keyPrefix")
    """Key prefix"""

    last_used_at: datetime | None = Field(alias="lastUsedAt", default=None)
    """Last used timestamp"""

    usage_count: float = Field(alias="usageCount")
    """Number of times used"""

    created_at: datetime = Field(alias="createdAt")
    """Creation timestamp"""


class AccountListApiKeysResponse(APIModel):
    keys: list[AccountListApiKeysResponseKeysItem]


class AccountCreateApiKeyResponse(APIModel):
    key_id: str = Field(alias="keyId")
    """Key ID"""

    key: str
    """Full API key (only shown once)"""

    key_prefix: str = Field(alias="keyPrefix")
    """Key prefix for display"""

    name: str
    """Key name"""

    created_at: datetime = Field(alias="createdAt")
    """Creation timestamp"""


class AccountRevokeApiKeyResponse(APIModel):
    deleted: Literal[True]

    key_id: str = Field(alias="keyId")


class AccountRetrieveStorageUsageResponseUsageProjects(APIModel):
    current: float

    limit: float

    percent: float


class AccountRetrieveStorageUsageResponseUsageDatasets(APIModel):
    current: float

    limit: float

    percent: float


class AccountRetrieveStorageUsageResponseUsageModels(APIModel):
    current: float

    limit: float

    percent: float


class AccountRetrieveStorageUsageResponseUsageImages(APIModel):
    current: float

    limit: float

    percent: float


class AccountRetrieveStorageUsageResponseUsageAnnotations(APIModel):
    current: float


class AccountRetrieveStorageUsageResponseUsageDeployments(APIModel):
    current: float

    limit: float

    percent: float


class AccountRetrieveStorageUsageResponseUsageStorage(APIModel):
    current: float
    """Current storage in bytes"""

    limit: float
    """Storage limit in bytes"""

    percent: float


class AccountRetrieveStorageUsageResponseUsage(APIModel):
    projects: AccountRetrieveStorageUsageResponseUsageProjects | None = Field(default=None)

    datasets: AccountRetrieveStorageUsageResponseUsageDatasets | None = Field(default=None)

    models: AccountRetrieveStorageUsageResponseUsageModels | None = Field(default=None)

    images: AccountRetrieveStorageUsageResponseUsageImages | None = Field(default=None)

    annotations: AccountRetrieveStorageUsageResponseUsageAnnotations | None = Field(default=None)

    deployments: AccountRetrieveStorageUsageResponseUsageDeployments | None = Field(default=None)

    storage: AccountRetrieveStorageUsageResponseUsageStorage


class AccountRetrieveStorageUsageResponseBreakdownByCategoryDatasets(APIModel):
    bytes: float

    count: float


class AccountRetrieveStorageUsageResponseBreakdownByCategoryModels(APIModel):
    bytes: float

    count: float


class AccountRetrieveStorageUsageResponseBreakdownByCategoryExports(APIModel):
    bytes: float

    count: float


class AccountRetrieveStorageUsageResponseBreakdownByCategory(APIModel):
    datasets: AccountRetrieveStorageUsageResponseBreakdownByCategoryDatasets

    models: AccountRetrieveStorageUsageResponseBreakdownByCategoryModels

    exports: AccountRetrieveStorageUsageResponseBreakdownByCategoryExports


class AccountRetrieveStorageUsageResponseBreakdownTopItemsItem(APIModel):
    id: str = Field(alias="_id")

    name: str

    slug: str | None = Field(default=None)
    """Resource name, e.g. `my-dataset`"""

    size_bytes: float = Field(alias="sizeBytes")

    type: Literal["project", "dataset", "model", "export"]

    parent_name: str | None = Field(alias="parentName", default=None)

    parent_slug: str | None = Field(alias="parentSlug", default=None)
    """Parent URL, e.g. `my-project`"""


class AccountRetrieveStorageUsageResponseBreakdown(APIModel):
    by_category: AccountRetrieveStorageUsageResponseBreakdownByCategory = Field(alias="byCategory")

    top_items: list[AccountRetrieveStorageUsageResponseBreakdownTopItemsItem] = Field(alias="topItems")


class AccountRetrieveStorageUsageResponse(APIModel):
    tier: Literal["free", "pro", "enterprise"]
    """User tier"""

    usage: AccountRetrieveStorageUsageResponseUsage

    updated_at: str | None = Field(alias="updatedAt")

    breakdown: AccountRetrieveStorageUsageResponseBreakdown

    region: Literal["us", "eu", "ap"]
    """Data region"""

    username: str


class AccountRetrieveProfileSettingsResponseSocials(APIModel):
    github: str | None = Field(default=None)

    linkedin: str | None = Field(default=None)

    twitter: str | None = Field(default=None)

    discord: str | None = Field(default=None)

    youtube: str | None = Field(default=None)

    scholar: str | None = Field(default=None)

    website: str | None = Field(default=None)


class AccountRetrieveProfileSettingsResponse(APIModel):
    display_name: str = Field(alias="displayName")

    company: str

    use_case: str = Field(alias="useCase")

    bio: str

    socials: AccountRetrieveProfileSettingsResponseSocials | None = Field(default=None)
    """Social profile URLs"""

    plan: Literal["free", "pro", "enterprise"]
    """User tier"""

    username: str

    email: str

    image_url: str = Field(alias="imageUrl")

    account_type: Literal["personal", "team"] = Field(alias="accountType")

    icon_color: str | None = Field(alias="iconColor", default=None)

    icon_letter: str | None = Field(alias="iconLetter", default=None)

    region: Literal["us", "eu", "ap"]
    """Data region"""


class AccountUpdateProfileSettingsResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class AccountListCloudStorageIntegrationsResponseIntegrationsItem(APIModel):
    id: str

    provider: Literal["gcs", "s3", "azure"]

    credential_identity: str = Field(alias="credentialIdentity")

    targets: list[str]

    created_at: datetime = Field(alias="createdAt")


class AccountListCloudStorageIntegrationsResponse(APIModel):
    integrations: list[AccountListCloudStorageIntegrationsResponseIntegrationsItem]


class AccountConnectCloudStorageResponse(APIModel):
    id: str

    provider: Literal["gcs", "s3", "azure"]

    credential_identity: str = Field(alias="credentialIdentity")

    targets: list[str]

    created_at: datetime = Field(alias="createdAt")


class AccountDiscoverCloudStorageLocationsResponse(APIModel):
    targets: list[str]


class AccountBrowseCloudStorageObjectsResponseEntriesItem(APIModel):
    kind: Literal["folder", "file"]

    name: str

    key: str

    size: float | None = Field(default=None)

    updated_at: datetime | None = Field(alias="updatedAt", default=None)


class AccountBrowseCloudStorageObjectsResponse(APIModel):
    entries: list[AccountBrowseCloudStorageObjectsResponseEntriesItem]

    cursor: str | None = Field(default=None)


class AccountRetrieveTrashResponseItemsItemParentProject(APIModel):
    id: str = Field(alias="_id")

    name: str

    slug: str


class AccountRetrieveTrashResponseItemsItem(APIModel):
    id: str = Field(alias="_id")

    type: Literal["project", "dataset", "model"]

    name: str
    """Display name"""

    slug: str
    """Resource name, e.g. `my-dataset`"""

    trashed_at: datetime = Field(alias="trashedAt")

    days_remaining: int = Field(alias="daysRemaining")

    cascaded_count: int | None = Field(alias="cascadedCount", default=None)

    parent_project: AccountRetrieveTrashResponseItemsItemParentProject | None = Field(
        alias="parentProject", default=None
    )

    size_bytes: float | None = Field(alias="sizeBytes", default=None)


class AccountRetrieveTrashResponseSummaryByTypeProjects(APIModel):
    count: int


class AccountRetrieveTrashResponseSummaryByTypeDatasets(APIModel):
    count: int

    size_bytes: float = Field(alias="sizeBytes")


class AccountRetrieveTrashResponseSummaryByTypeModels(APIModel):
    count: int

    size_bytes: float = Field(alias="sizeBytes")


class AccountRetrieveTrashResponseSummaryByTypeExports(APIModel):
    count: int

    size_bytes: float = Field(alias="sizeBytes")


class AccountRetrieveTrashResponseSummaryByType(APIModel):
    projects: AccountRetrieveTrashResponseSummaryByTypeProjects

    datasets: AccountRetrieveTrashResponseSummaryByTypeDatasets

    models: AccountRetrieveTrashResponseSummaryByTypeModels

    exports: AccountRetrieveTrashResponseSummaryByTypeExports


class AccountRetrieveTrashResponseSummary(APIModel):
    total_items: int = Field(alias="totalItems")

    total_size_bytes: float = Field(alias="totalSizeBytes")

    by_type: AccountRetrieveTrashResponseSummaryByType = Field(alias="byType")


class AccountRetrieveTrashResponse(APIModel):
    items: list[AccountRetrieveTrashResponseItemsItem]

    total: float

    page: int

    limit: int

    total_pages: int = Field(alias="totalPages")

    summary: AccountRetrieveTrashResponseSummary

    region: Literal["us", "eu", "ap"]
    """Data region"""


class AccountRestoreTrashedItemResponse(APIModel):
    success: Literal[True]

    restored_models: int | None = Field(alias="restoredModels", default=None)


class AccountPermanentlyDeleteTrashedItemResponse(APIModel):
    success: Literal[True]

    deleted_count: int = Field(alias="deletedCount")

    cascaded_models: int | None = Field(alias="cascadedModels", default=None)


class AccountPermanentlyDeleteAllTrashedItemsResponseDeleted(APIModel):
    projects: int

    datasets: int

    models: int

    deployments: int


class AccountPermanentlyDeleteAllTrashedItemsResponse(APIModel):
    success: Literal[True]

    deleted: AccountPermanentlyDeleteAllTrashedItemsResponseDeleted

    total_deleted: int = Field(alias="totalDeleted")


class AccountRetrieveIfUsernameIsAvailableResponse(APIModel):
    available: bool

    username: str


class AccountRetrievePublicUserProfileResponseUserSocials(APIModel):
    github: str | None = Field(default=None)

    linkedin: str | None = Field(default=None)

    twitter: str | None = Field(default=None)

    discord: str | None = Field(default=None)

    youtube: str | None = Field(default=None)

    scholar: str | None = Field(default=None)

    website: str | None = Field(default=None)


class AccountRetrievePublicUserProfileResponseUser(APIModel):
    username: str

    full_name: str | None = Field(alias="fullName", default=None)

    image_url: str | None = Field(alias="imageUrl", default=None)

    account_type: Literal["personal", "team"] = Field(alias="accountType")

    icon_color: str | None = Field(alias="iconColor", default=None)

    icon_letter: str | None = Field(alias="iconLetter", default=None)

    bio: str | None = Field(default=None)

    company: str | None = Field(default=None)

    use_case: str | None = Field(alias="useCase", default=None)

    socials: AccountRetrievePublicUserProfileResponseUserSocials | None = Field(default=None)
    """Social profile URLs"""

    follower_count: int = Field(alias="followerCount")

    is_followed: bool = Field(alias="isFollowed")


class AccountRetrievePublicUserProfileResponse(APIModel):
    user: AccountRetrievePublicUserProfileResponseUser


class AccountFollowOrUnfollowUserResponse(APIModel):
    followed: bool

    follower_count: int = Field(alias="followerCount")


class AccountUploadWorkspaceIconResponse(APIModel):
    success: Literal[True]

    download_url: str = Field(alias="downloadUrl")


class AccountDeleteWorkspaceIconResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class BillingRetrieveBalanceResponse(APIModel):
    credits_cents: float = Field(alias="creditsCents")
    """Available balance in cents"""

    plan: Literal["free", "pro", "enterprise"]
    """Subscription tier"""


class BillingListTransactionsResponseTransactionsItemModel(APIModel):
    name: str

    slug: str

    project_slug: str = Field(alias="projectSlug")

    username: str


class BillingListTransactionsResponseTransactionsItem(APIModel):
    type: str
    """Transaction type"""

    amount_cents: float = Field(alias="amountCents")
    """Amount in cents"""

    balance_after: float = Field(alias="balanceAfter")
    """Balance after transaction"""

    model_id: str | None = Field(alias="modelId", default=None)

    period: str | None = Field(default=None)

    created_at: datetime = Field(alias="createdAt")
    """Transaction timestamp"""

    receipt_url: str | None = Field(alias="receiptUrl", default=None)

    model: BillingListTransactionsResponseTransactionsItemModel | None = Field(default=None)


class BillingListTransactionsResponse(APIModel):
    transactions: list[BillingListTransactionsResponseTransactionsItem]


class BillingListUsageSummaryResponsePlan(APIModel):
    plan_id: Literal["free", "pro", "enterprise"] = Field(alias="planId")
    """User tier"""

    name: str

    status: Literal["active", "past_due"]

    cancel_at_period_end: bool = Field(alias="cancelAtPeriodEnd")

    payment_failed_at: datetime | None = Field(alias="paymentFailedAt", default=None)

    billing_cycle: Literal["monthly", "yearly"] | None = Field(alias="billingCycle", default=None)

    current_period_end: datetime | None = Field(alias="currentPeriodEnd", default=None)

    enterprise_license_end: str | None = Field(alias="enterpriseLicenseEnd", default=None)

    license_expired: bool | None = Field(alias="licenseExpired", default=None)


class BillingListUsageSummaryResponseMetricsItem(APIModel):
    metric_id: Literal["storage_bytes"] = Field(alias="metricId")

    kind: Literal["GAUGE"]

    period: Literal["NONE"]

    limit: float

    used: float

    remaining: float

    overage_allowed: bool = Field(alias="overageAllowed")


class BillingListUsageSummaryResponseTrainingCredit(APIModel):
    monthly_grant: float = Field(alias="monthlyGrant")

    balance_available: float = Field(alias="balanceAvailable")


class BillingListUsageSummaryResponseFeatures(APIModel):
    private_projects: bool = Field(alias="privateProjects")

    teams: bool

    enterprise_license: bool = Field(alias="enterpriseLicense")


class BillingListUsageSummaryResponse(APIModel):
    plan: BillingListUsageSummaryResponsePlan

    metrics: list[BillingListUsageSummaryResponseMetricsItem]

    training_credit: BillingListUsageSummaryResponseTrainingCredit = Field(alias="trainingCredit")

    features: BillingListUsageSummaryResponseFeatures

    credits_cents: float = Field(alias="creditsCents")

    paid_seats: float | None = Field(alias="paidSeats", default=None)

    current_seats: float | None = Field(alias="currentSeats", default=None)

    max_seats: float | None = Field(alias="maxSeats", default=None)

    next_invoice_cents: float | None = Field(alias="nextInvoiceCents", default=None)


class ActivityListResponseEventsItem(APIModel):
    id: str = Field(alias="_id")
    """Event ID"""

    user_id: str = Field(alias="userId")
    """User who performed action"""

    user_email: str = Field(alias="userEmail")
    """User email"""

    user_name: str = Field(alias="userName")
    """User name"""

    action: Literal[
        "created",
        "updated",
        "deleted",
        "trashed",
        "restored",
        "started",
        "completed",
        "failed",
        "cancelled",
        "uploaded",
        "shared",
        "unshared",
        "exported",
        "cloned",
        "analyzed",
    ]
    """Activity action"""

    resource_type: Literal[
        "project", "dataset", "model", "training", "export", "deployment", "settings", "onboarding", "api_key"
    ] = Field(alias="resourceType")
    """Resource type"""

    resource_id: str | None = Field(alias="resourceId", default=None)
    """Resource ID"""

    resource_name: str | None = Field(alias="resourceName", default=None)
    """Resource name"""

    metadata: dict[str, Any] | None = Field(default=None)

    timestamp: datetime
    """When action occurred"""

    seen: bool
    """Whether seen by owner"""

    archived: bool
    """Whether archived"""


class ActivityListResponseFilters(APIModel):
    archived: bool

    search: str | None = Field(default=None)

    start: datetime | None = Field(default=None)

    end: datetime | None = Field(default=None)


class ActivityListResponseActivityItem(APIModel):
    id: str = Field(alias="_id")
    """Event ID"""

    user_id: str = Field(alias="userId")
    """User who performed action"""

    user_email: str = Field(alias="userEmail")
    """User email"""

    user_name: str = Field(alias="userName")
    """User name"""

    action: Literal[
        "created",
        "updated",
        "deleted",
        "trashed",
        "restored",
        "started",
        "completed",
        "failed",
        "cancelled",
        "uploaded",
        "shared",
        "unshared",
        "exported",
        "cloned",
        "analyzed",
    ]
    """Activity action"""

    resource_type: Literal[
        "project", "dataset", "model", "training", "export", "deployment", "settings", "onboarding", "api_key"
    ] = Field(alias="resourceType")
    """Resource type"""

    resource_id: str | None = Field(alias="resourceId", default=None)
    """Resource ID"""

    resource_name: str | None = Field(alias="resourceName", default=None)
    """Resource name"""

    metadata: dict[str, Any] | None = Field(default=None)

    timestamp: datetime
    """When action occurred"""

    seen: bool
    """Whether seen by owner"""

    archived: bool
    """Whether archived"""


class ActivityListResponse(APIModel):
    events: list[ActivityListResponseEventsItem] | None = Field(default=None)

    total: float | None = Field(default=None)
    """Total events"""

    unseen_count: float | None = Field(alias="unseenCount", default=None)
    """Unseen, unarchived events"""

    exported_at: datetime | None = Field(alias="exportedAt", default=None)

    app: Literal["alpha"] | None = Field(default=None)

    owner: str | None = Field(default=None)

    filters: ActivityListResponseFilters | None = Field(default=None)

    activity: list[ActivityListResponseActivityItem] | None = Field(default=None)


class ActivityCreateMarkSeenResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class ActivityArchiveResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class ExploreRetrieveSearchResponseProjectsItem(APIModel):
    id: str = Field(alias="_id")

    slug: str

    name: str

    description: str | None = Field(default=None)

    username: str

    visibility: Literal["public", "private"]
    """Visibility"""

    icon_color: str | None = Field(alias="iconColor", default=None)

    icon_letter: str | None = Field(alias="iconLetter", default=None)

    icon_image: str | None = Field(alias="iconImage", default=None)

    model_count: int = Field(alias="modelCount")

    model_names: list[str] = Field(alias="modelNames")

    total_bytes: float = Field(alias="totalBytes")

    star_count: int = Field(alias="starCount")

    user_image_url: str | None = Field(alias="userImageUrl", default=None)

    updated_at: datetime = Field(alias="updatedAt")


class ExploreRetrieveSearchResponseDatasetsItemSplits(APIModel):
    train: float
    """Training images"""

    val: float
    """Validation images"""

    test: float
    """Test images"""

    labeled: float
    """Labeled images"""


class ExploreRetrieveSearchResponseDatasetsItemSampleImagesItemLabelsItem(APIModel):
    class_id: float = Field(alias="classId")
    """Class index (0-based)"""

    bbox: list[float] | None = Field(default=None)
    """Bounding box [x_center, y_center, width, height] normalized 0-1"""

    segments: list[float] | None = Field(default=None)
    """Segmentation points, normalized 0-1"""

    keypoints: list[float] | None = Field(default=None)
    """Keypoints [x, y, visibility, ...] normalized 0-1"""

    obb: list[float] | None = Field(default=None)
    """Oriented bounding box [x1,y1,x2,y2,x3,y3,x4,y4] normalized 0-1"""

    skeleton_id: str | None = Field(alias="skeletonId", default=None)
    """Skeleton template ID for pose keypoint connections"""


class ExploreRetrieveSearchResponseDatasetsItemSampleImagesItem(APIModel):
    url: str
    """Signed thumbnail URL"""

    image_url: str | None = Field(alias="imageUrl", default=None)
    """Signed full-size image URL used as a thumbnail fallback"""

    width: float
    """Image width in pixels"""

    height: float
    """Image height in pixels"""

    labels: list[ExploreRetrieveSearchResponseDatasetsItemSampleImagesItemLabelsItem] | None = Field(default=None)
    """Preview annotations overlaid on the sample image"""


class ExploreRetrieveSearchResponseDatasetsItem(APIModel):
    id: str = Field(alias="_id")

    slug: str

    name: str

    description: str | None = Field(default=None)

    username: str

    visibility: Literal["public", "private"]
    """Visibility"""

    image_count: int = Field(alias="imageCount")

    class_count: int | None = Field(alias="classCount", default=None)

    class_names: list[str] | None = Field(alias="classNames", default=None)

    class_colors: dict[str, str] | None = Field(alias="classColors", default=None)

    task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"]
    """YOLO task type"""

    total_bytes: float | None = Field(alias="totalBytes", default=None)

    tags: list[str] | None = Field(default=None)

    splits: ExploreRetrieveSearchResponseDatasetsItemSplits | None = Field(default=None)
    """Dataset split statistics"""

    kpt_shape: list[Any] | None = Field(alias="kptShape", default=None)

    star_count: int = Field(alias="starCount")

    sample_images: list[ExploreRetrieveSearchResponseDatasetsItemSampleImagesItem] = Field(alias="sampleImages")

    user_image_url: str | None = Field(alias="userImageUrl", default=None)

    updated_at: datetime = Field(alias="updatedAt")


class ExploreRetrieveSearchResponse(APIModel):
    projects: list[ExploreRetrieveSearchResponseProjectsItem]
    """Matching projects"""

    datasets: list[ExploreRetrieveSearchResponseDatasetsItem]
    """Matching datasets"""

    has_more: bool = Field(alias="hasMore")
    """Whether more results exist"""


class ExploreRetrieveSidebarResponseProjectsItem(APIModel):
    id: str = Field(alias="_id")

    slug: str

    name: str

    model_count: int = Field(alias="modelCount")

    icon_color: str | None = Field(alias="iconColor", default=None)

    icon_letter: str | None = Field(alias="iconLetter", default=None)

    icon_image: str | None = Field(alias="iconImage", default=None)


class ExploreRetrieveSidebarResponseDatasetsItem(APIModel):
    id: str = Field(alias="_id")

    slug: str

    name: str

    image_count: int | None = Field(alias="imageCount", default=None)

    thumbnail: str | None = Field(default=None)


class ExploreRetrieveSidebarResponse(APIModel):
    projects: list[ExploreRetrieveSidebarResponseProjectsItem]

    datasets: list[ExploreRetrieveSidebarResponseDatasetsItem]


class UploadRetrieveFileUrlResponse(APIModel):
    session_id: str = Field(alias="sessionId")
    """Upload session ID"""

    upload_url: str = Field(alias="uploadUrl")
    """Signed upload URL"""

    expires_at: datetime = Field(alias="expiresAt")
    """URL expiry"""


class UploadCompleteResponseFile(APIModel):
    size: float
    """Uploaded file size in bytes"""

    content_type: str | None = Field(alias="contentType", default=None)
    """Detected content type"""


class UploadCompleteResponse(APIModel):
    success: Literal[True]

    file: UploadCompleteResponseFile


class TeamsListResponseTeamsItem(APIModel):
    user_id: str = Field(alias="userId")
    """Team user ID"""

    username: str
    """Team username"""

    full_name: str | None = Field(alias="fullName", default=None)
    """Team display name"""

    image_url: str | None = Field(alias="imageUrl", default=None)

    icon_color: str | None = Field(alias="iconColor", default=None)

    icon_letter: str | None = Field(alias="iconLetter", default=None)

    plan: Literal["free", "pro", "enterprise"]
    """User tier"""

    region: Literal["us", "eu", "ap"]
    """Data region"""

    role: str
    """Current user's role in team"""

    denied_reason: str | None = Field(alias="deniedReason", default=None)
    """Why the workspace is currently unavailable"""


class TeamsListResponse(APIModel):
    teams: list[TeamsListResponseTeamsItem]


class TeamsCreateResponseTeam(APIModel):
    user_id: str = Field(alias="userId")
    """Team user ID (team_...)"""

    username: str
    """Team username"""

    full_name: str = Field(alias="fullName")
    """Team display name"""

    icon_color: str = Field(alias="iconColor")
    """Icon background color"""

    icon_letter: str = Field(alias="iconLetter")
    """Icon letter(s)"""

    plan: str
    """Team plan (starts as free)"""

    region: str
    """Data region"""

    role: str
    """Creator's role (owner)"""


class TeamsCreateResponse(APIModel):
    team: TeamsCreateResponseTeam


class TeamsListMembersResponseMembersItem(APIModel):
    user_id: str | None = Field(alias="userId", default=None)
    """User ID; absent for an invitation that has not been accepted"""

    username: str
    """Username"""

    email: str
    """Email"""

    role: str
    """Team role"""

    status: Literal["pending", "active"]

    joined_at: datetime = Field(alias="joinedAt")
    """When member joined"""

    image_url: str | None = Field(alias="imageUrl", default=None)
    """Profile image URL"""

    invited_by: str | None = Field(alias="invitedBy", default=None)

    invite_id: str | None = Field(alias="inviteId", default=None)

    invite_created_at: datetime | None = Field(alias="inviteCreatedAt", default=None)


class TeamsListMembersResponse(APIModel):
    members: list[TeamsListMembersResponseMembersItem]

    max_seats: float = Field(alias="maxSeats")
    """Maximum team seats"""


class TeamsInviteResponse(APIModel):
    invited: Literal[True]

    email: str


class TeamsChangeMemberRoleResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class TeamsRemoveMemberOrLeaveResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""


class TeamsTransferOwnershipResponse(APIModel):
    success: Literal[True]
    """Operation succeeded"""
