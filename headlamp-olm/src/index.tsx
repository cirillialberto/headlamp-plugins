import { K8s, registerAppBarAction, registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, ConfirmButton, DetailsGrid, Link, ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';

const OLM_GROUP = 'operators.coreos.com';
const OLM_VERSION = 'v1alpha1';

const ClusterServiceVersionClass = K8s.crd.makeCustomResourceClass({
	apiInfo: [{ group: OLM_GROUP, version: OLM_VERSION }],
	isNamespaced: true,
	pluralName: 'clusterserviceversions',
	singularName: 'clusterserviceversion',
	kind: 'ClusterServiceVersion',
});

class ClusterServiceVersion extends ClusterServiceVersionClass {
	static get detailsRoute() {
		return 'olm-csv-detail';
	}
}

const SubscriptionClass = K8s.crd.makeCustomResourceClass({
	apiInfo: [{ group: OLM_GROUP, version: OLM_VERSION }],
	isNamespaced: true,
	pluralName: 'subscriptions',
	singularName: 'subscription',
	kind: 'Subscription',
});

class Subscription extends SubscriptionClass {
	static get detailsRoute() {
		return 'olm-subscriptions-detail';
	}
}

const CatalogSourceClass = K8s.crd.makeCustomResourceClass({
	apiInfo: [{ group: OLM_GROUP, version: OLM_VERSION }],
	isNamespaced: true,
	pluralName: 'catalogsources',
	singularName: 'catalogsource',
	kind: 'CatalogSource',
});

class CatalogSource extends CatalogSourceClass {
	static get detailsRoute() {
		return 'olm-catalogsources-detail';
	}
}

const InstallPlanClass = K8s.crd.makeCustomResourceClass({
	apiInfo: [{ group: OLM_GROUP, version: OLM_VERSION }],
	isNamespaced: true,
	pluralName: 'installplans',
	singularName: 'installplan',
	kind: 'InstallPlan',
});

const PackageManifestClass = K8s.crd.makeCustomResourceClass({
	apiInfo: [{ group: 'packages.operators.coreos.com', version: 'v1' }],
	isNamespaced: true,
	pluralName: 'packagemanifests',
	singularName: 'packagemanifest',
	kind: 'PackageManifest',
});

class InstallPlan extends InstallPlanClass {
	static get detailsRoute() {
		return 'olm-installplans-detail';
	}
}

class PackageManifest extends PackageManifestClass {
	static get detailsRoute() {
		return 'olm-packages-detail';
	}
}

function getSubscriptionHealth(item: any) {
	const status = item?.jsonData?.status?.state;
	if (status === 'AtLatestKnown') return { badge: '✓ Latest', color: '#4CAF50' };
	if (status === 'UpgradePending') return { badge: '↻ Updating', color: '#FF9800' };
	if (status === 'UpgradeAvailable') return { badge: '⬆ Available', color: '#2196F3' };
	return { badge: '⚠ Check', color: '#F44336' };
}

function getInstallPlanHealth(item: any) {
	const approved = item?.jsonData?.spec?.approved;
	const phase = item?.jsonData?.status?.phase;
	if (!approved) return { badge: '⏱ Needs Approval', color: '#FF9800' };
	if (phase === 'Complete') return { badge: '✓ Complete', color: '#4CAF50' };
	if (phase === 'Failed') return { badge: '✗ Failed', color: '#F44336' };
	return { badge: phase || 'Installing', color: '#2196F3' };
}

function getCSVHealth(item: any) {
	const phase = item?.jsonData?.status?.phase;
	if (phase === 'Succeeded') return { badge: '✓ OK', color: '#4CAF50' };
	if (phase === 'Failed') return { badge: '✗ Failed', color: '#F44336' };
	if (phase === 'Replacing') return { badge: '↻ Replacing', color: '#FF9800' };
	return { badge: phase || 'Unknown', color: '#9C27B0' };
}

function getSubscriptionDrift(item: any) {
	const desiredChannel = item?.jsonData?.spec?.channel;
	const state = item?.jsonData?.status?.state;
	const pendingCSV = item?.jsonData?.status?.currentCSV;
	const installedCSV = item?.jsonData?.status?.installedCSV;

	if (state === 'UpgradeAvailable') return { label: 'Update available', color: '#FF9800' };
	if (pendingCSV && installedCSV && pendingCSV !== installedCSV) return { label: 'Reconciling', color: '#2196F3' };
	if (!desiredChannel) return { label: 'Missing channel', color: '#F44336' };
	return { label: 'In sync', color: '#4CAF50' };
}

function makeSearchFilter(extraPaths: string[] = []) {
	return (item: any, search?: string) => {
		if (!search) return true;
		const q = search.toLowerCase();
		const values: string[] = [
			item?.metadata?.name,
			item?.metadata?.namespace,
			...extraPaths.map(path => path.split('.').reduce((obj: any, key) => obj?.[key], item?.jsonData ?? item)),
		]
			.filter(Boolean)
			.map(v => String(v).toLowerCase());
		return values.some(v => v.includes(q));
	};
}

function computeHealthScore({ csvs, subscriptions, installPlans }: { csvs: any[]; subscriptions: any[]; installPlans: any[] }) {
	let score = 100;
	const failedCSV = csvs.filter(csv => csv?.jsonData?.status?.phase === 'Failed').length;
	const replacingCSV = csvs.filter(csv => csv?.jsonData?.status?.phase === 'Replacing').length;
	const outOfDateSub = subscriptions.filter(sub => sub?.jsonData?.status?.state === 'UpgradeAvailable').length;
	const pendingInstallPlans = installPlans.filter(ip => ip?.jsonData?.spec?.approved === false).length;

	score -= failedCSV * 25;
	score -= replacingCSV * 8;
	score -= outOfDateSub * 6;
	score -= pendingInstallPlans * 10;
	if (score < 0) score = 0;

	const level = score >= 85 ? 'Healthy' : score >= 60 ? 'Warning' : 'Critical';
	const color = score >= 85 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336';
	return { score, level, color, failedCSV, replacingCSV, outOfDateSub, pendingInstallPlans };
}

function detectOlmVersion(csvs: any[]) {
	const candidates = (csvs || []).filter(csv => {
		const name = String(csv?.metadata?.name || '').toLowerCase();
		const displayName = String(csv?.jsonData?.spec?.displayName || '').toLowerCase();
		return name.includes('olm') || displayName.includes('operator lifecycle manager') || displayName === 'olm';
	});

	if (candidates.length === 0) {
		return 'n/a';
	}

	const newest = [...candidates].sort((a, b) => {
		const tsA = new Date(a?.metadata?.creationTimestamp || 0).getTime();
		const tsB = new Date(b?.metadata?.creationTimestamp || 0).getTime();
		return tsB - tsA;
	})[0];

	return newest?.jsonData?.spec?.version || newest?.jsonData?.status?.version || 'n/a';
}

function buildLifecycleTimeline(item: any, type: string) {
	const timeline: Array<{ ts: string; label: string; detail: string }> = [];
	const created = item?.metadata?.creationTimestamp;
	if (created) timeline.push({ ts: created, label: 'Created', detail: `${type} created in cluster` });

	const status = item?.jsonData?.status || {};
	const spec = item?.jsonData?.spec || {};

	if (status.lastUpdated) timeline.push({ ts: status.lastUpdated, label: 'Last status update', detail: status.state || status.phase || 'Status updated' });
	if (type === 'Subscription' && status.currentCSV) timeline.push({ ts: status.lastUpdated || created || new Date().toISOString(), label: 'Current target CSV', detail: status.currentCSV });
	if (type === 'InstallPlan') timeline.push({ ts: created || new Date().toISOString(), label: spec.approved ? 'Approved' : 'Pending approval', detail: status.phase || spec.approval || 'Unknown phase' });

	if (Array.isArray(status.conditions)) {
		status.conditions.forEach((cond: any) => {
			timeline.push({
				ts: cond.lastTransitionTime || created || new Date().toISOString(),
				label: `Condition: ${cond.type || 'unknown'}`,
				detail: `${cond.status || ''} ${cond.reason || ''}`.trim() || 'Condition changed',
			});
		});
	}

	return timeline.sort((a, b) => (a.ts < b.ts ? -1 : 1));
}

function OLMIntelligencePanel() {
	const [csvs] = ClusterServiceVersion.useList();
	const [subscriptions] = Subscription.useList();
	const [installPlans] = InstallPlan.useList();
	const [catalogSources] = CatalogSource.useList();

	const summary = React.useMemo(() => computeHealthScore({ csvs: csvs || [], subscriptions: subscriptions || [], installPlans: installPlans || [] }), [csvs, subscriptions, installPlans]);
	const topIssues = React.useMemo(() => {
		const issues: string[] = [];
		if (summary.failedCSV > 0) issues.push(`${summary.failedCSV} CSV in failed state`);
		if (summary.pendingInstallPlans > 0) issues.push(`${summary.pendingInstallPlans} InstallPlan pending approval`);
		if (summary.outOfDateSub > 0) issues.push(`${summary.outOfDateSub} Subscription with updates available`);
		if ((catalogSources || []).length === 0) issues.push('No CatalogSource detected');
		return issues;
	}, [summary, catalogSources]);
	const olmVersion = React.useMemo(() => detectOlmVersion(csvs || []), [csvs]);

	return (
		<SectionBox title="Operator Intelligence">
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
				<div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
					<div style={{ fontSize: 12, color: '#666' }}>Health score</div>
					<div style={{ fontWeight: 700, color: summary.color }}>{summary.score}/100 ({summary.level})</div>
				</div>
				<div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
					<div style={{ fontSize: 12, color: '#666' }}>Installed OLM version</div>
					<div style={{ fontWeight: 700 }}>{olmVersion}</div>
				</div>
				<div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
					<div style={{ fontSize: 12, color: '#666' }}>CSV total</div>
					<div style={{ fontWeight: 700 }}>{(csvs || []).length}</div>
				</div>
				<div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
					<div style={{ fontSize: 12, color: '#666' }}>Subscriptions</div>
					<div style={{ fontWeight: 700 }}>{(subscriptions || []).length}</div>
				</div>
				<div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
					<div style={{ fontSize: 12, color: '#666' }}>Pending approvals</div>
					<div style={{ fontWeight: 700, color: summary.pendingInstallPlans > 0 ? '#FF9800' : '#4CAF50' }}>{summary.pendingInstallPlans}</div>
				</div>
			</div>
			<div style={{ marginTop: 10, fontSize: 12 }}>
				<div style={{ fontWeight: 700, marginBottom: 4 }}>Top issues</div>
				{topIssues.length === 0 ? <div style={{ color: '#4CAF50' }}>No active critical issue detected.</div> : <ul style={{ margin: 0, paddingLeft: 18 }}>{topIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
			</div>
		</SectionBox>
	);
}

function OLMView() {
	const dashboardItems = [
		{ icon: '📦', title: 'Operator Catalog', desc: 'Available packages & channels', routeName: 'olm-packages-route' },
		{ icon: '📋', title: 'Cluster Service Versions', desc: 'Installed operators status', routeName: 'olm-csv-route' },
		{ icon: '🔄', title: 'Subscriptions', desc: 'Updates & channel management', routeName: 'olm-subscriptions-route' },
		{ icon: '🗂️', title: 'Catalog Sources', desc: 'Configured operator registries', routeName: 'olm-catalogsources-route' },
		{ icon: '✅', title: 'Install Plans', desc: 'Approval & rollout status', routeName: 'olm-installplans-route' },
	];

	return (
		<SectionBox title="Operator Lifecycle Management">
			<OLMIntelligencePanel />
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
				{dashboardItems.map((item) => (
					<Link key={item.routeName} routeName={item.routeName}>
						<div
							style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, transition: 'all 0.2s', cursor: 'pointer' }}
							onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
							onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
						>
							<div style={{ fontWeight: 700 }}>{item.icon} {item.title}</div>
							<div style={{ fontSize: 12, color: '#666' }}>{item.desc}</div>
						</div>
					</Link>
				))}
			</div>
			<div style={{ marginTop: 14, fontSize: 12, color: '#666' }}>Use the OLM submenu on the left to open each resource list.</div>
		</SectionBox>
	);
}

function PackageManifestListView() {
	return (
		<SectionBox title="Operator Packages">
			<ResourceListView
				title="Available Operator Packages"
				resourceClass={PackageManifest}
				filterFunction={makeSearchFilter(['status.catalogSource', 'status.catalogSourceNamespace', 'status.defaultChannel'])}
				columns={[
					'name',
					'namespace',
					{ id: 'catalogName', label: 'Catalog', getValue: (item: any) => item?.jsonData?.status?.catalogSource || '-' },
					{ id: 'defaultChannel', label: 'Default Channel', getValue: (item: any) => item?.jsonData?.status?.defaultChannel || '-' },
					{
						id: 'signals',
						label: 'Signals',
						getValue: (item: any) => {
							const channels = item?.jsonData?.status?.channels || [];
							const pre = channels.some((c: any) => ['alpha', 'beta', 'candidate'].some(k => String(c.name || '').includes(k)));
							return pre ? 'Pre-release channels' : 'Stable';
						},
						render: (item: any) => {
							const channels = item?.jsonData?.status?.channels || [];
							const pre = channels.some((c: any) => ['alpha', 'beta', 'candidate'].some(k => String(c.name || '').includes(k)));
							return <span style={{ color: pre ? '#FF9800' : '#4CAF50', fontWeight: 600 }}>{pre ? '⚠ Pre-release' : '✓ Stable'}</span>;
						},
					},
					{
						id: 'currentCSV',
						label: 'Latest CSV',
						getValue: (item: any) => {
							const channels = item?.jsonData?.status?.channels || [];
							const defaultCh = item?.jsonData?.status?.defaultChannel;
							const currentChannel = channels.find((c: any) => c.name === defaultCh);
							return currentChannel?.currentCSV || '-';
						},
					},
					'age',
				]}
			/>
		</SectionBox>
	);
}

function PackageManifestDetailsView() {
	const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
	return (
		<DetailsGrid
			resourceType={PackageManifest}
			namespace={namespace}
			name={name}
			withEvents
			extraSections={(item) =>
				item
					? [
							{
								id: 'olm-package-advisor',
								section: (
									<SectionBox title="Upgrade Advisor">
										<div style={{ fontSize: 12 }}>
											<div><b>Default channel:</b> {item?.jsonData?.status?.defaultChannel || '-'}</div>
											<div><b>Catalog source:</b> {item?.jsonData?.status?.catalogSource || '-'} / {item?.jsonData?.status?.catalogSourceNamespace || '-'}</div>
											<div style={{ marginTop: 6, color: '#666' }}>Tip: use stable channels in prod and keep alpha/beta only for canary.</div>
										</div>
									</SectionBox>
								),
							},
							{
								id: 'olm-channels',
								section: (
									<SectionBox title="Channels">
										{(item?.jsonData?.status?.channels || []).length > 0 ? (
											<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
												<thead>
													<tr style={{ borderBottom: '1px solid #ddd' }}>
														<th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Channel</th>
														<th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Current CSV</th>
														<th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Version</th>
													</tr>
												</thead>
												<tbody>
													{(item?.jsonData?.status?.channels || []).map((ch: any) => (
														<tr key={ch.name} style={{ borderBottom: '1px solid #eee' }}>
															<td style={{ padding: 8 }}>{ch.name}</td>
															<td style={{ padding: 8 }}>{ch.currentCSV || '-'}</td>
															<td style={{ padding: 8 }}>{ch.currentCSVDesc?.version || '-'}</td>
														</tr>
													))}
												</tbody>
											</table>
										) : (
											<div style={{ padding: 8, color: '#999' }}>No channels found</div>
										)}
									</SectionBox>
								),
							},
					  ]
					: []
			}
		/>
	);
}

function CSVListView() {
	return (
		<SectionBox title="ClusterServiceVersions">
			<ResourceListView
				title="ClusterServiceVersions"
				resourceClass={ClusterServiceVersion}
				filterFunction={makeSearchFilter(['spec.displayName', 'spec.version', 'status.phase'])}
				columns={[
					'name',
					'namespace',
					{ id: 'displayName', label: 'Display Name', getValue: (item: any) => item?.jsonData?.spec?.displayName || '-' },
					{ id: 'displayVersion', label: 'Version', getValue: (item: any) => item?.jsonData?.spec?.version || '-' },
					{
						id: 'phase',
						label: 'Status',
						getValue: (item: any) => getCSVHealth(item).badge,
						render: (item: any) => {
							const health = getCSVHealth(item);
							return <span style={{ color: health.color, fontWeight: 600 }}>{health.badge}</span>;
						},
					},
					'age',
				]}
			/>
		</SectionBox>
	);
}

function SubscriptionListView() {
	const [patchBusy, setPatchBusy] = React.useState<string | null>(null);

	const patchChannel = async (item: any) => {
		const current = item?.jsonData?.spec?.channel || '';
		const next = window.prompt('Insert target channel', current);
		if (!next || next === current) return;
		try {
			setPatchBusy(item?.metadata?.uid || item?.metadata?.name || null);
			await item.patch({ spec: { channel: next } });
		} catch (err) {
			console.error('[OLM Plugin] Failed to patch Subscription channel', err);
			window.alert('Failed to patch Subscription channel. Check RBAC and console logs.');
		} finally {
			setPatchBusy(null);
		}
	};

	return (
		<SectionBox title="Subscriptions">
			<ResourceListView
				title="Subscriptions"
				resourceClass={Subscription}
				filterFunction={makeSearchFilter(['spec.channel', 'spec.name', 'status.currentCSV', 'status.state'])}
				columns={[
					'name',
					'namespace',
					{ id: 'channel', label: 'Channel', getValue: (item: any) => item?.jsonData?.spec?.channel || '-' },
					{ id: 'package', label: 'Package', getValue: (item: any) => item?.jsonData?.spec?.name || '-' },
					{ id: 'currentCsv', label: 'Current CSV', getValue: (item: any) => item?.jsonData?.status?.currentCSV || '-' },
					{
						id: 'drift',
						label: 'Drift',
						getValue: (item: any) => getSubscriptionDrift(item).label,
						render: (item: any) => {
							const drift = getSubscriptionDrift(item);
							return <span style={{ color: drift.color, fontWeight: 600 }}>{drift.label}</span>;
						},
					},
					{
						id: 'state',
						label: 'State',
						getValue: (item: any) => getSubscriptionHealth(item).badge,
						render: (item: any) => {
							const health = getSubscriptionHealth(item);
							return <span style={{ color: health.color, fontWeight: 600 }}>{health.badge}</span>;
						},
					},
					{
						id: 'actions',
						label: 'Actions',
						getValue: () => 'actions',
						render: (item: any) => (
							<ActionButton
								description={patchBusy === (item?.metadata?.uid || item?.metadata?.name) ? 'Patching...' : 'Patch channel'}
								icon="mdi:swap-horizontal"
								onClick={() => patchChannel(item)}
								iconButtonProps={{ disabled: patchBusy === (item?.metadata?.uid || item?.metadata?.name) }}
							/>
						),
					},
					'age',
				]}
			/>
		</SectionBox>
	);
}

function CatalogSourceListView() {
	return (
		<SectionBox title="CatalogSources">
			<ResourceListView
				title="CatalogSources"
				resourceClass={CatalogSource}
				filterFunction={makeSearchFilter(['spec.sourceType', 'spec.publisher', 'spec.displayName'])}
				columns={[
					'name',
					'namespace',
					{ id: 'sourceType', label: 'Source Type', getValue: (item: any) => item?.jsonData?.spec?.sourceType || '-' },
					{ id: 'publisher', label: 'Publisher', getValue: (item: any) => item?.jsonData?.spec?.publisher || '-' },
					{ id: 'displayName', label: 'Display Name', getValue: (item: any) => item?.jsonData?.spec?.displayName || '-' },
					'age',
				]}
			/>
		</SectionBox>
	);
}

function InstallPlanListView() {
	const [installPlans] = InstallPlan.useList();
	const [bulkBusy, setBulkBusy] = React.useState(false);
	const [bulkMessage, setBulkMessage] = React.useState('');

	const approveAllPending = async () => {
		const pending = (installPlans || []).filter(ip => ip?.jsonData?.spec?.approved === false);
		if (pending.length === 0) {
			setBulkMessage('No pending InstallPlan found.');
			return;
		}

		setBulkBusy(true);
		setBulkMessage('');
		let success = 0;
		let fail = 0;
		for (const ip of pending) {
			try {
				await ip.patch({ spec: { approved: true } });
				success += 1;
			} catch (err) {
				console.error('[OLM Plugin] Failed to approve InstallPlan', err);
				fail += 1;
			}
		}
		setBulkBusy(false);
		setBulkMessage(`Bulk approval completed. Success: ${success}, failed: ${fail}`);
	};

	return (
		<SectionBox title="InstallPlans">
			<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
				<ConfirmButton
					variant="outlined"
					size="small"
					confirmTitle="Approve all pending InstallPlans"
					confirmDescription="This action patches all pending InstallPlans setting spec.approved=true."
					onConfirm={approveAllPending}
					disabled={bulkBusy}
				>
					Approve pending InstallPlans
				</ConfirmButton>
				{bulkMessage ? <span style={{ fontSize: 12, color: '#666' }}>{bulkMessage}</span> : null}
			</div>
			<ResourceListView
				title="InstallPlans"
				resourceClass={InstallPlan}
				filterFunction={makeSearchFilter(['spec.approval', 'status.phase'])}
				columns={[
					'name',
					'namespace',
					{
						id: 'approved',
						label: 'Approved',
						getValue: (item: any) => (item?.jsonData?.spec?.approved ? '✓' : '⏱'),
						render: (item: any) => {
							const approved = item?.jsonData?.spec?.approved;
							return <span style={{ color: approved ? '#4CAF50' : '#FF9800', fontWeight: 600 }}>{approved ? '✓ Yes' : '⏱ Pending'}</span>;
						},
					},
					{ id: 'approval', label: 'Approval', getValue: (item: any) => item?.jsonData?.spec?.approval || '-' },
					{
						id: 'phase',
						label: 'Phase',
						getValue: (item: any) => getInstallPlanHealth(item).badge,
						render: (item: any) => {
							const health = getInstallPlanHealth(item);
							return <span style={{ color: health.color, fontWeight: 600 }}>{health.badge}</span>;
						},
					},
					'age',
				]}
			/>
		</SectionBox>
	);
}

function CSVDetailsView() {
	const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
	return (
		<DetailsGrid
			resourceType={ClusterServiceVersion}
			namespace={namespace}
			name={name}
			withEvents
			extraSections={(item) =>
				item
					? [
							{
								id: 'olm-csv-timeline',
								section: (
									<SectionBox title="Lifecycle Timeline">
										<ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
											{buildLifecycleTimeline(item, 'ClusterServiceVersion').map((e, idx) => <li key={`${e.ts}-${idx}`}><b>{e.label}</b> - {e.detail} ({new Date(e.ts).toLocaleString()})</li>)}
										</ul>
									</SectionBox>
								),
							},
					  ]
					: []
			}
		/>
	);
}

function SubscriptionDetailsView() {
	const [installPlans] = InstallPlan.useList();
	const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
	return (
		<DetailsGrid
			resourceType={Subscription}
			namespace={namespace}
			name={name}
			withEvents
			extraSections={(item) => {
				if (!item) return [];
				const drift = getSubscriptionDrift(item);
				const relatedInstallPlan = (installPlans || []).find(ip => (ip?.jsonData?.spec?.clusterServiceVersionNames || []).includes(item?.jsonData?.status?.currentCSV));
				const backupTs = item?.metadata?.annotations?.['velero.io/last-backup'] || item?.metadata?.annotations?.['backup.velero.io/last-backup'];
				return [
					{
						id: 'olm-subscription-advisor',
						section: (
							<SectionBox title="Upgrade Advisor & Drift">
								<div style={{ fontSize: 12 }}>
									<div><b>Drift:</b> <span style={{ color: drift.color }}>{drift.label}</span></div>
									<div><b>Current CSV:</b> {item?.jsonData?.status?.currentCSV || '-'}</div>
									<div><b>Installed CSV:</b> {item?.jsonData?.status?.installedCSV || '-'}</div>
									<div><b>Pending InstallPlan:</b> {relatedInstallPlan ? relatedInstallPlan?.metadata?.name : 'none'}</div>
									<div><b>Backup gate:</b> {backupTs ? `OK (${backupTs})` : 'No backup annotation found'}</div>
									<div style={{ marginTop: 6, color: '#666' }}>Recommended: run canary namespace first before broad rollout.</div>
								</div>
							</SectionBox>
						),
					},
					{
						id: 'olm-subscription-timeline',
						section: (
							<SectionBox title="Lifecycle Timeline">
								<ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
									{buildLifecycleTimeline(item, 'Subscription').map((e, idx) => <li key={`${e.ts}-${idx}`}><b>{e.label}</b> - {e.detail} ({new Date(e.ts).toLocaleString()})</li>)}
								</ul>
							</SectionBox>
						),
					},
				];
			}}
		/>
	);
}

function CatalogSourceDetailsView() {
	const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
	return <DetailsGrid resourceType={CatalogSource} namespace={namespace} name={name} withEvents />;
}

function InstallPlanDetailsView() {
	const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
	return (
		<DetailsGrid
			resourceType={InstallPlan}
			namespace={namespace}
			name={name}
			withEvents
			extraSections={(item) =>
				item
					? [
							{
								id: 'olm-installplan-timeline',
								section: (
									<SectionBox title="Lifecycle Timeline">
										<ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
											{buildLifecycleTimeline(item, 'InstallPlan').map((e, idx) => <li key={`${e.ts}-${idx}`}><b>{e.label}</b> - {e.detail} ({new Date(e.ts).toLocaleString()})</li>)}
										</ul>
									</SectionBox>
								),
							},
					  ]
					: []
			}
		/>
	);
}

registerAppBarAction(() => <span style={{ fontWeight: 700 }}>OLM</span>);
registerSidebarEntry({ parent: null, name: 'olm', label: 'OLM', url: '/olm', icon: 'mdi:store' });
registerSidebarEntry({ parent: 'olm', name: 'olm-packages', label: 'Operator Catalog', url: '/olm/packages', icon: 'mdi:package-open' });
registerSidebarEntry({ parent: 'olm', name: 'olm-csv', label: 'ClusterServiceVersions', url: '/olm/csv', icon: 'mdi:cube-outline' });
registerSidebarEntry({ parent: 'olm', name: 'olm-subscriptions', label: 'Subscriptions', url: '/olm/subscriptions', icon: 'mdi:bookmark-multiple-outline' });
registerSidebarEntry({ parent: 'olm', name: 'olm-catalogsources', label: 'CatalogSources', url: '/olm/catalogsources', icon: 'mdi:bookshelf' });
registerSidebarEntry({ parent: 'olm', name: 'olm-installplans', label: 'InstallPlans', url: '/olm/installplans', icon: 'mdi:clipboard-check-outline' });

try {
	registerRoute({ path: '/olm', sidebar: 'olm', name: 'olm-route', exact: true, component: () => <OLMView /> });
	registerRoute({ path: '/olm/packages', sidebar: 'olm-packages', name: 'olm-packages-route', exact: true, component: () => <PackageManifestListView /> });
	registerRoute({ path: '/olm/packages/:namespace/:name', sidebar: 'olm-packages', name: 'olm-packages-detail', exact: true, component: () => <PackageManifestDetailsView /> });
	registerRoute({ path: '/olm/csv', sidebar: 'olm-csv', name: 'olm-csv-route', exact: true, component: () => <CSVListView /> });
	registerRoute({ path: '/olm/subscriptions', sidebar: 'olm-subscriptions', name: 'olm-subscriptions-route', exact: true, component: () => <SubscriptionListView /> });
	registerRoute({ path: '/olm/catalogsources', sidebar: 'olm-catalogsources', name: 'olm-catalogsources-route', exact: true, component: () => <CatalogSourceListView /> });
	registerRoute({ path: '/olm/installplans', sidebar: 'olm-installplans', name: 'olm-installplans-route', exact: true, component: () => <InstallPlanListView /> });

	registerRoute({ path: '/olm/csv/:namespace/:name', sidebar: 'olm-csv', name: 'olm-csv-detail', exact: true, component: () => <CSVDetailsView /> });
	registerRoute({ path: '/olm/subscriptions/:namespace/:name', sidebar: 'olm-subscriptions', name: 'olm-subscriptions-detail', exact: true, component: () => <SubscriptionDetailsView /> });
	registerRoute({ path: '/olm/catalogsources/:namespace/:name', sidebar: 'olm-catalogsources', name: 'olm-catalogsources-detail', exact: true, component: () => <CatalogSourceDetailsView /> });
	registerRoute({ path: '/olm/installplans/:namespace/:name', sidebar: 'olm-installplans', name: 'olm-installplans-detail', exact: true, component: () => <InstallPlanDetailsView /> });
	console.log('[OLM Plugin] Successfully registered routes and sidebar entries');
} catch (err) {
	console.error('[OLM Plugin] Failed to register routes:', err);
}
import { K8s, registerAppBarAction, registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, ConfirmButton, DetailsGrid, Link, ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
